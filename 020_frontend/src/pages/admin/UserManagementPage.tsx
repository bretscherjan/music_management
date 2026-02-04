import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Users, Search, UserCheck, UserX, Pencil, Plus, Trash2 } from 'lucide-react';
import { getStatusLabel } from '@/lib/utils';
import type { UserStatus, User } from '@/types';
import { AdminEditUserDialog } from '@/components/admin/AdminEditUserDialog';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';

export function UserManagementPage() {
    const isAdmin = useIsAdmin();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
    const [registerFilter, setRegisterFilter] = useState<number | 'all'>('all');

    // Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.getAll(),
    });

    const { data: registers } = useQuery({
        queryKey: ['registers'],
        queryFn: () => registerService.getAll(),
    });



    const handleEditUser = (user: User) => {
        if (!isAdmin) return;
        setSelectedUser(user);
        setIsEditDialogOpen(true);
    };

    const deleteUserMutation = useMutation({
        mutationFn: userService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Fehler beim Löschen des Benutzers');
        }
    });

    const handleDeleteUser = (user: User) => {
        if (!isAdmin) return;
        if (window.confirm(`Möchten Sie das Mitglied ${user.firstName} ${user.lastName} wirklich löschen?`)) {
            deleteUserMutation.mutate(user.id);
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
                            Neues Mitglied
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
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={statusFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('all')}
                            >
                                Alle
                            </Button>
                            <Button
                                variant={statusFilter === 'active' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('active')}
                            >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Aktiv
                            </Button>
                            <Button
                                variant={statusFilter === 'passive' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('passive')}
                            >
                                <UserX className="h-4 w-4 mr-1" />
                                Passiv
                            </Button>
                        </div>

                        {/* Register Filter */}
                        <select
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={registerFilter}
                            onChange={(e) => setRegisterFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        >
                            <option value="all">Alle Register</option>
                            {registers?.map((reg) => (
                                <option key={reg.id} value={reg.id}>{reg.name}</option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {usersLoading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <ZoomableTableWrapper title="Mitgliederliste">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">E-Mail</TableHead>
                                        <TableHead className="hidden lg:table-cell">Telefon</TableHead>
                                        <TableHead>Register</TableHead>
                                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                                        <TableHead className="hidden sm:table-cell">Rolle</TableHead>
                                        {isAdmin && <TableHead className="text-right">Aktionen</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium py-3 sm:py-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium">
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground sm:hidden truncate max-w-[180px]">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                                                {user.email}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                                                {user.phoneNumber || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span>{user.register?.name || '–'}</span>
                                                    <div className="flex gap-1 sm:hidden">
                                                        <Badge variant={statusVariant[user.status]} className="text-[10px] h-5 px-1.5">
                                                            {getStatusLabel(user.status)}
                                                        </Badge>
                                                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="text-[10px] h-5 px-1.5">
                                                            {user.role === 'admin' ? 'Admin' : 'Mitgl.'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge variant={statusVariant[user.status]}>
                                                    {getStatusLabel(user.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                                                    {user.role === 'admin' ? 'Admin' : 'Mitglied'}
                                                </Badge>
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-right py-3 sm:py-4">
                                                    <div className="flex gap-1 justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditUser(user)}
                                                            className="h-10 w-10 text-muted-foreground"
                                                        >
                                                            <Pencil className="h-5 w-5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="h-10 w-10 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                                                Keine Mitglieder gefunden
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ZoomableTableWrapper>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            {isAdmin && (
                <>
                    <AdminEditUserDialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                        user={selectedUser}
                        registers={registers}
                    />
                    <CreateUserDialog
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                    />
                </>
            )}

            {/* Summary */}
            {users && (
                <div className="text-sm text-muted-foreground text-center">
                    {filteredUsers.length} von {users.length} Mitgliedern angezeigt
                </div>
            )}
        </div>
    );
}

export default UserManagementPage;
