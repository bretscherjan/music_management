import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCan } from '@/context/AuthContext';
import { setlistService, type Setlist, type CreateSetlistDto } from '@/services/setlistService';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListMusic, Plus, MoreVertical, Pencil, Trash2, Music2 } from 'lucide-react';

export function SetlistPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const can = useCan();
    const canWrite = can('setlists:write');

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Setlist | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Setlist | null>(null);
    const [form, setForm] = useState<CreateSetlistDto>({ name: '', description: '' });

    const { data: setlists = [], isLoading } = useQuery({
        queryKey: ['setlists'],
        queryFn: () => setlistService.getAll(),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateSetlistDto) => setlistService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['setlists'] });
            toast.success('Setlist erstellt');
            setCreateOpen(false);
            setForm({ name: '', description: '' });
        },
        onError: () => toast.error('Fehler beim Erstellen'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateSetlistDto> }) =>
            setlistService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['setlists'] });
            toast.success('Setlist aktualisiert');
            setEditTarget(null);
        },
        onError: () => toast.error('Fehler beim Aktualisieren'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => setlistService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['setlists'] });
            toast.success('Setlist gelöscht');
            setDeleteTarget(null);
        },
        onError: () => toast.error('Fehler beim Löschen'),
    });

    const openEdit = (setlist: Setlist) => {
        setEditTarget(setlist);
        setForm({ name: setlist.name, description: setlist.description ?? '' });
    };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <PageHeader
                title="Setlists"
                subtitle="Stücklisten für Auftritte und Proben"
                Icon={ListMusic}
                actions={
                    canWrite && (
                        <Button
                            className="h-11 w-11 sm:w-auto sm:px-5 gap-1.5 rounded-2xl shadow-sm"
                            onClick={() => { setForm({ name: '', description: '' }); setCreateOpen(true); }}
                        >
                            <Plus className="h-5 w-5 flex-shrink-0" />
                            <span className="hidden sm:inline">Neue Setlist</span>
                        </Button>
                    )
                }
            />

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
            ) : setlists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                    <ListMusic className="h-12 w-12 opacity-30" />
                    <p className="text-sm">Noch keine Setlists vorhanden</p>
                    {canWrite && (
                        <Button variant="outline" onClick={() => setCreateOpen(true)}>
                            Erste Setlist erstellen
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {setlists.map((sl) => (
                        <div
                            key={sl.id}
                            className="relative rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/member/setlists/${sl.id}`)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Music2 className="h-5 w-5 text-primary flex-shrink-0" />
                                    <h3 className="font-semibold text-base truncate">{sl.name}</h3>
                                </div>
                                {canWrite && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(sl); }}>
                                                <Pencil className="h-4 w-4 mr-2" /> Bearbeiten
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(sl); }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Löschen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {sl.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{sl.description}</p>
                            )}

                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <Badge variant="secondary">{sl.items.length} Stücke</Badge>
                                {sl.event && (
                                    <Badge variant="outline" className="truncate max-w-[150px]">
                                        {sl.event.title}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Neue Setlist erstellen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="z.B. Konzert Frühlingsfest 2026"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Beschreibung</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Optionale Beschreibung..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
                        <Button
                            onClick={() => createMutation.mutate(form)}
                            disabled={!form.name.trim() || createMutation.isPending}
                        >
                            Erstellen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setlist bearbeiten</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Beschreibung</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>Abbrechen</Button>
                        <Button
                            onClick={() => editTarget && updateMutation.mutate({ id: editTarget.id, data: form })}
                            disabled={!form.name.trim() || updateMutation.isPending}
                        >
                            Speichern
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setlist löschen?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground py-2">
                        Die Setlist <strong>{deleteTarget?.name}</strong> wird unwiderruflich gelöscht.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Abbrechen</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                            disabled={deleteMutation.isPending}
                        >
                            Löschen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
