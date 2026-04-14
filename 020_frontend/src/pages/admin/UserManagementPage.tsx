import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { userService } from '@/services/userService';
import { registerService } from '@/services/registerService';
import { useCan } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Pencil, Plus, Trash2, SlidersHorizontal, MoreVertical } from 'lucide-react';
import { getStatusLabel } from '@/lib/utils';
import type { UserStatus, User } from '@/types';
import { AdminEditUserDialog } from '@/components/admin/AdminEditUserDialog';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';

export function UserManagementPage() {
    const can = useCan();
    const canReadRegisters = can('registers:read');
    const canWriteMembers = can('members:write');
    const canManageMemberPermissions = can('members:permissions');
    const canManageMembers = canWriteMembers || canManageMemberPermissions;
    const [searchParams] = useSearchParams();
    const searchParam = searchParams.get('search');
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState(searchParam || '');
    const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
    const [registerFilter, setRegisterFilter] = useState<number | 'all'>('all');

    // Dialog / Drawer State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [actionDrawerUser, setActionDrawerUser] = useState<User | null>(null);

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.getAll(),
    });

    const { data: registers } = useQuery({
        queryKey: ['registers'],
        queryFn: () => registerService.getAll(),
        enabled: canReadRegisters,
    });

    useEffect(() => {
        if (searchParam) {
            setSearchTerm(searchParam);
        }
    }, [searchParam]);

    const handleEditUser = (user: User) => {
        if (!canManageMembers) return;
        setSelectedUser(user);
        setIsEditDialogOpen(true);
    };

    const deleteUserMutation = useMutation({
        mutationFn: userService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Mitglied erfolgreich gelöscht');
            setIsDeleteDialogOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Fehler beim Löschen des Benutzers');
        }
    });

    const handleDeleteUser = (user: User) => {
        if (!canWriteMembers) return;
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedUser) {
            deleteUserMutation.mutate(selectedUser.id);
        }
    };

    // Filter and sort users
    const filteredUsers = users
        ?.filter((user) => {
            // Search filter
            const matchesSearch =
                searchTerm === '' ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

            // Register filter
            const matchesRegister =
                registerFilter === 'all' || user.registerId === registerFilter;

            return matchesSearch && matchesStatus && matchesRegister;
        })
        .sort((a, b) => {
            // Sort by register, then by name
            const regA = a.register?.name || 'ZZZ';
            const regB = b.register?.name || 'ZZZ';
            if (regA !== regB) return regA.localeCompare(regB);
            return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
        }) || [];

    const statusVariant: Record<UserStatus, 'success' | 'secondary' | 'outline'> = {
        active: 'success',
        passive: 'secondary',
        former: 'outline',
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 pt-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {canManageMembers ? 'Mitglieder-Verwaltung' : 'Mitgliederliste'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {filteredUsers.length} Mitglieder
                    </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    {/* Mobile: filter icon */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="md:hidden h-11 w-11"
                        onClick={() => setFilterSheetOpen(true)}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                    {canWriteMembers && (
                        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} className="gap-1.5 h-11 px-4">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Neues Mitglied</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Search + inline filters (desktop) */}
            <div className="native-group p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Name oder E-Mail suchen..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Desktop-only filters */}
                    {canReadRegisters && (
                        <div className="hidden md:block w-44">
                            <Select value={String(registerFilter)} onValueChange={(v) => setRegisterFilter(v === 'all' ? 'all' : parseInt(v))}>
                                <SelectTrigger><SelectValue placeholder="Register" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Register</SelectItem>
                                    {registers?.map((reg) => (
                                        <SelectItem key={reg.id} value={String(reg.id)}>{reg.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="hidden md:block w-40">
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Status</SelectItem>
                                <SelectItem value="active">Aktiv</SelectItem>
                                <SelectItem value="passive">Passiv</SelectItem>
                                <SelectItem value="former">Ehemalig</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Filter Sheet (mobile) */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetContent side="bottom" className="pb-safe-nav">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Filter</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4">
                        {canReadRegisters && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Register</p>
                                <Select value={String(registerFilter)} onValueChange={(v) => setRegisterFilter(v === 'all' ? 'all' : parseInt(v))}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Register" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Alle Register</SelectItem>
                                        {registers?.map((reg) => (
                                            <SelectItem key={reg.id} value={String(reg.id)}>{reg.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Status</SelectItem>
                                    <SelectItem value="active">Aktiv</SelectItem>
                                    <SelectItem value="passive">Passiv</SelectItem>
                                    <SelectItem value="former">Ehemalig</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full h-11" onClick={() => setFilterSheetOpen(false)}>
                            Anwenden
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Mobile Card List */}
            <div className="md:hidden">
                {usersLoading ? (
                    <div className="native-group divide-y divide-border/40">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-4">
                                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="native-group p-8 text-center text-sm text-muted-foreground">
                        Keine Mitglieder gefunden
                    </div>
                ) : (
                    <div className="native-group divide-y divide-border/40">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                                {/* Left: avatar icon */}
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-primary">
                                        {user.firstName[0]}{user.lastName[0]}
                                    </span>
                                </div>
                                {/* Center: info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm truncate">{user.firstName} {user.lastName}</span>
                                        <Badge variant={statusVariant[user.status]} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                            {getStatusLabel(user.status)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {[user.register?.name, user.email].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                {/* Right: 3-dots */}
                                {canManageMembers && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 flex-shrink-0"
                                        onClick={() => setActionDrawerUser(user)}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile Action Drawer */}
            <Sheet open={!!actionDrawerUser} onOpenChange={(open) => { if (!open) setActionDrawerUser(null); }}>
                <SheetContent side="bottom" className="pb-safe-nav">
                    <SheetHeader className="mb-2">
                        <SheetTitle className="text-left text-base">
                            {actionDrawerUser?.firstName} {actionDrawerUser?.lastName}
                        </SheetTitle>
                        <p className="text-xs text-muted-foreground text-left">
                            {actionDrawerUser?.register?.name || '–'} · {actionDrawerUser?.email}
                        </p>
                    </SheetHeader>
                    <div className="divide-y divide-border/40">
                        <Button
                            variant="ghost"
                            className="w-full h-12 justify-start gap-3 text-base font-normal"
                            onClick={() => { if (actionDrawerUser) { handleEditUser(actionDrawerUser); setActionDrawerUser(null); } }}
                        >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            Bearbeiten
                        </Button>
                        {canWriteMembers && (
                            <Button
                                variant="ghost"
                                className="w-full h-12 justify-start gap-3 text-base font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => { if (actionDrawerUser) { handleDeleteUser(actionDrawerUser); setActionDrawerUser(null); } }}
                            >
                                <Trash2 className="h-4 w-4" />
                                Löschen
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Table */}
            <div className="hidden md:block native-group overflow-hidden">
                <ZoomableTableWrapper>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Register</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>E-Mail</TableHead>
                                {canManageMembers && <TableHead className="text-right">Aktionen</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usersLoading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        {canManageMembers && <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>}
                                    </TableRow>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={canManageMembers ? 5 : 4} className="h-32 text-center text-muted-foreground">
                                        Keine Mitglieder gefunden
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="h-12 hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">
                                            {user.firstName} {user.lastName}
                                        </TableCell>
                                        <TableCell>{user.register?.name || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[user.status]}>
                                                {getStatusLabel(user.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        {canManageMembers && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {canWriteMembers && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDeleteUser(user)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ZoomableTableWrapper>
            </div>

            {/* Dialogs */}
            {canManageMembers && selectedUser && (
                <AdminEditUserDialog
                    key={selectedUser.id}
                    user={selectedUser}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    registers={registers}
                />
            )}

            {canWriteMembers && (
                <CreateUserDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                />
            )}

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Mitglied löschen"
                description={`Bist du sicher, dass du ${selectedUser?.firstName} ${selectedUser?.lastName} löschen möchtest? Dies kann nicht rückgängig gemacht werden.`}
                onConfirm={confirmDelete}
                confirmText="Löschen"
                variant="destructive"
            />
        </div>
    );
}
