import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registerService } from '@/services/registerService';
import { userService } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Pencil, Trash2, Users, MoreVertical, Music } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import type { Register } from '@/types/register';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';

export function RegisterManagementPage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(null);
    const [editingRegister, setEditingRegister] = useState<Register | null>(null);
    const [name, setName] = useState('');
    const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [actionDrawerRegister, setActionDrawerRegister] = useState<Register | null>(null);

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
            toast.success('Register erfolgreich gespeichert');
            handleClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Speichern');
            toast.error(err.response?.data?.message || 'Fehler beim Speichern');
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: registerService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['registers'] });
            toast.success('Register erfolgreich gelöscht');
            setIsDeleteDialogOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Fehler beim Löschen des Registers');
        }
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
            toast.error('Register mit Mitgliedern können nicht gelöscht werden. Bitte entfernen Sie zuerst die Mitglieder.');
            return;
        }

        setSelectedRegisterId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedRegisterId) {
            deleteMutation.mutate(selectedRegisterId);
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
        <div className="space-y-5">
            <PageHeader
                title="Registerverwaltung"
                subtitle="Stimmen und Instrumentengruppen verwalten"
                Icon={Music}
                actions={
                    <Button onClick={handleOpenCreate} className="h-11 w-11 sm:w-auto sm:px-5 gap-1.5 rounded-2xl shadow-sm">
                        <Plus className="h-5 w-5 flex-shrink-0" />
                        <span className="hidden sm:inline">Neues Register</span>
                    </Button>
                }
            />

            {/* Mobile card list */}
            <div className="md:hidden">
                {registersLoading ? (
                    <div className="native-group divide-y divide-border/40">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-4">
                                <div className="h-10 w-10 rounded-xl bg-muted flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-4 bg-muted rounded w-28" />
                                    <div className="h-3 bg-muted rounded w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !registers?.length ? (
                    <div className="native-group p-8 text-center text-sm text-muted-foreground">
                        Keine Register gefunden
                    </div>
                ) : (
                    <div className="native-group divide-y divide-border/40">
                        {registers.map((register) => (
                            <div key={register.id} className="flex items-center gap-3 px-4 py-3">
                                {/* Left: icon */}
                                <div className="inset-icon bg-primary/10 flex-shrink-0">
                                    <Users className="h-4 w-4 text-primary" />
                                </div>
                                {/* Center */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{register.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(register as any).memberCount || 0} Mitglieder
                                    </p>
                                </div>
                                {/* Right: 3-dots */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 flex-shrink-0"
                                    onClick={() => setActionDrawerRegister(register)}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile action drawer */}
            <Sheet open={!!actionDrawerRegister} onOpenChange={(open) => { if (!open) setActionDrawerRegister(null); }}>
                <SheetContent side="bottom" className="pb-safe-nav">
                    <SheetHeader className="mb-2">
                        <SheetTitle className="text-left text-base">{actionDrawerRegister?.name}</SheetTitle>
                        <p className="text-xs text-muted-foreground text-left">
                            {(actionDrawerRegister as any)?.memberCount || 0} Mitglieder
                        </p>
                    </SheetHeader>
                    <div className="divide-y divide-border/40">
                        <Button
                            variant="ghost"
                            className="w-full h-12 justify-start gap-3 text-base font-normal"
                            onClick={() => { if (actionDrawerRegister) { handleOpenEdit(actionDrawerRegister); setActionDrawerRegister(null); } }}
                        >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            Bearbeiten
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full h-12 justify-start gap-3 text-base font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { if (actionDrawerRegister) { handleDelete(actionDrawerRegister.id); setActionDrawerRegister(null); } }}
                        >
                            <Trash2 className="h-4 w-4" />
                            Löschen
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop table */}
            <div className="hidden md:block native-group overflow-hidden">
                {registersLoading ? (
                    <div className="p-6 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ZoomableTableWrapper title="Registerliste">
                        <Table className="min-w-[400px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Mitglieder</TableHead>
                                    <TableHead className="w-[100px] text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registers?.map((register) => (
                                    <TableRow key={register.id} className="h-12">
                                        <TableCell className="font-medium">{register.name}</TableCell>
                                        <TableCell>{(register as any).memberCount || 0} Mitglieder</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(register)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(register.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!registers?.length && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                            Keine Register gefunden
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ZoomableTableWrapper>
                )}
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto" topPlacement>
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
                            <div className="border rounded-xl p-2 h-60 overflow-y-auto space-y-1">
                                {users?.map(user => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${assignedUserIds.includes(user.id)
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
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl">
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

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Register löschen"
                description="Wollen Sie dieses Register wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
                onConfirm={confirmDelete}
                confirmText="Löschen"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
