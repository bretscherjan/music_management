import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { userService } from '@/services/userService';
import { registerService } from '@/services/registerService';
import { useIsAdmin } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, Pencil, Plus, Trash2 } from 'lucide-react';
import { getStatusLabel } from '@/lib/utils';
import type { UserStatus, User } from '@/types';
import { AdminEditUserDialog } from '@/components/admin/AdminEditUserDialog';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';

export function UserManagementPage() {
    const isAdmin = useIsAdmin();
    const [searchParams] = useSearchParams();
    const searchParam = searchParams.get('search');
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState(searchParam || '');
    const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
    const [registerFilter, setRegisterFilter] = useState<number | 'all'>('all');

    // Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.getAll(),
    });

    const { data: registers } = useQuery({
        queryKey: ['registers'],
        queryFn: () => registerService.getAll(),
    });

    useEffect(() => {
        if (searchParam) {
            setSearchTerm(searchParam);
        }
    }, [searchParam]);

    const handleEditUser = (user: User) => {
        if (!isAdmin) return;
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
        if (!isAdmin) return;
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        {isAdmin ? 'Mitglieder-Verwaltung' : 'Mitgliederliste'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isAdmin
                            ? 'Verwalte die Vereinsmitglieder, Status und Register-Zuordnungen'
                            : 'Übersicht aller Vereinsmitglieder'
                        }
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex gap-2">
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Neuer Mitglied
                        </Button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Name oder E-Mail suchen..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Register Filter */}
                        <div className="flex gap-2 items-center">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Register:</span>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={registerFilter}
                                onChange={(e) => setRegisterFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            >
                                <option value="all">Alle</option>
                                {registers?.map((reg) => (
                                    <option key={reg.id} value={reg.id}>
                                        {reg.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2 items-center">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">Alle</option>
                                <option value="active">Aktiv</option>
                                <option value="passive">Passiv</option>
                                <option value="former">Ehemalig</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            <div className="rounded-md border bg-card overflow-hidden">
                <ZoomableTableWrapper>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Register</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>E-Mail</TableHead>
                                {isAdmin && <TableHead className="text-right">Aktionen</TableHead>}
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
                                        {isAdmin && <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>}
                                    </TableRow>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 5 : 4} className="h-32 text-center text-muted-foreground">
                                        Keine Mitglieder gefunden
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">
                                            {user.firstName} {user.lastName}
                                        </TableCell>
                                        <TableCell>
                                            {user.register?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[user.status]}>
                                                {getStatusLabel(user.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteUser(user)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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

            {/* Pagination / Total count */}
            <div className="text-sm text-muted-foreground">
                Gesamt: {filteredUsers.length} Mitglieder
            </div>

            {/* Dialogs */}
            {isAdmin && selectedUser && (
                <AdminEditUserDialog
                    user={selectedUser}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    registers={registers}
                />
            )}

            {isAdmin && (
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
