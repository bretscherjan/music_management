import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registerService } from '@/services/registerService';
import { userService } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Pencil, Trash2, Users } from 'lucide-react';
import type { Register } from '@/types/register';

export function RegisterManagementPage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRegister, setEditingRegister] = useState<Register | null>(null);
    const [name, setName] = useState('');
    const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch Registers
    const { data: registers, isLoading: registersLoading } = useQuery({
        queryKey: ['registers'],
        queryFn: () => registerService.getAll(),
    });

    // Fetch All Users (for selection)
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.getAll(),
    });

    // Create/Update Mutation
    const saveMutation = useMutation({
        mutationFn: async (data: { name: string, assignUserIds: number[] }) => {
            if (editingRegister) {
                return registerService.update(editingRegister.id, data);
            }
            return registerService.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['registers'] });
            queryClient.invalidateQueries({ queryKey: ['users'] }); // Refresh users to show new register assignments
            handleClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Speichern');
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: registerService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['registers'] });
        },
    });

    const handleOpenCreate = () => {
        setEditingRegister(null);
        setName('');
        setAssignedUserIds([]);
        setError(null);
        setIsDialogOpen(true);
    };

    const handleOpenEdit = async (register: Register) => {
        setEditingRegister(register);
        setName(register.name);

        // Fetch full register details to get current members
        try {
            const data = await registerService.getById(register.id);
            if (data && data.users) {
                setAssignedUserIds(data.users.map(u => u.id));
            } else {
                setAssignedUserIds([]);
            }
        } catch (err) {
            console.error('Failed to fetch register members', err);
            setAssignedUserIds([]);
        }

        setError(null);
        setIsDialogOpen(true);
    };

    const handleClose = () => {
        setIsDialogOpen(false);
        setEditingRegister(null);
        setName('');
        setAssignedUserIds([]);
        setError(null);
        saveMutation.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate({ name, assignUserIds: assignedUserIds });
    };

    const handleDelete = async (id: number) => {
        // Find register to check member count
        const reg = registers?.find(r => r.id === id);
        if (reg && (reg as any).memberCount > 0) {
            alert('Register mit Mitgliedern können nicht gelöscht werden. Bitte entfernen Sie zuerst die Mitglieder.');
            return;
        }

        if (window.confirm('Wollen Sie dieses Register wirklich löschen?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleUserToggle = (userId: number) => {
        setAssignedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Registerverwaltung</h1>
                    <p className="text-muted-foreground">
                        Stimmen und Instrumentengruppen verwalten
                    </p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Neues Register
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Alle Register
                    </CardTitle>
                    <CardDescription>
                        Auflistung aller aktiven Register im Verein
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {registersLoading ? (
                        <div className="text-center py-6">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Mitglieder</TableHead>
                                    <TableHead className="w-[100px] text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registers?.map((register) => (
                                    <TableRow key={register.id}>
                                        <TableCell className="font-medium">{register.name}</TableCell>
                                        <TableCell>{(register as any).memberCount || 0} Mitglieder</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(register)}
                                                    className="h-8 w-8"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(register.id)}
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {registers?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            Keine Register gefunden
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRegister ? 'Register bearbeiten' : 'Neues Register erstellen'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name des Registers</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="z.B. Tenor"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Mitglieder zuweisen</Label>
                            <div className="border rounded-md p-2 h-60 overflow-y-auto space-y-1">
                                {users?.map(user => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${assignedUserIds.includes(user.id)
                                            ? 'bg-primary/20 hover:bg-primary/30'
                                            : 'hover:bg-muted'
                                            }`}
                                        onClick={() => handleUserToggle(user.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={assignedUserIds.includes(user.id)}
                                            readOnly
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium">{user.firstName} {user.lastName}</span>
                                            {user.registerId && user.registerId !== editingRegister?.id && (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    (Aktuell: {user.register?.name})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ausgewählte Benutzer werden diesem Register zugewiesen. Falls sie bereits einem anderen Register angehören, wird die Zuordnung geändert.
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={saveMutation.isPending}>
                                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Speichern
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
