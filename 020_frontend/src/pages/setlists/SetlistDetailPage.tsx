import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCan } from '@/context/AuthContext';
import { setlistService, type SetlistItem, type AddSetlistItemDto } from '@/services/setlistService';
import { sheetMusicService } from '@/services/sheetMusicService';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ListMusic,
    Plus,
    Trash2,
    GripVertical,
    ChevronLeft,
    Music,
    Coffee,
    Type,
} from 'lucide-react';

const TYPE_ICONS = {
    sheetMusic: <Music className="h-4 w-4 text-primary" />,
    pause: <Coffee className="h-4 w-4 text-orange-400" />,
    custom: <Type className="h-4 w-4 text-blue-400" />,
};

const TYPE_LABELS = {
    sheetMusic: 'Stück',
    pause: 'Pause',
    custom: 'Benutzerdefiniert',
};

export function SetlistDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const can = useCan();
    const canWrite = can('setlists:write');

    const [addOpen, setAddOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SetlistItem | null>(null);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [addForm, setAddForm] = useState<AddSetlistItemDto>({
        type: 'sheetMusic',
        title: '',
        notes: '',
    });
    const [sheetMusicSearch, setSheetMusicSearch] = useState('');

    const { data: setlist, isLoading } = useQuery({
        queryKey: ['setlists', id],
        queryFn: () => setlistService.getById(Number(id)),
        enabled: !!id,
    });

    const { data: sheetMusicList } = useQuery({
        queryKey: ['sheet-music', 'all'],
        queryFn: () => sheetMusicService.getAll({ limit: 200 }),
        enabled: addOpen && addForm.type === 'sheetMusic',
    });

    const addMutation = useMutation({
        mutationFn: (data: AddSetlistItemDto) => setlistService.addItem(Number(id), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['setlists', id] });
            toast.success('Eintrag hinzugefügt');
            setAddOpen(false);
            setAddForm({ type: 'sheetMusic', title: '', notes: '' });
            setSheetMusicSearch('');
        },
        onError: () => toast.error('Fehler beim Hinzufügen'),
    });

    const removeMutation = useMutation({
        mutationFn: (itemId: number) => setlistService.removeItem(Number(id), itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['setlists', id] });
            toast.success('Eintrag entfernt');
            setDeleteTarget(null);
        },
        onError: () => toast.error('Fehler beim Entfernen'),
    });

    const reorderMutation = useMutation({
        mutationFn: (items: { id: number; position: number }[]) =>
            setlistService.reorderItems(Number(id), items),
        onSuccess: (updated) => {
            queryClient.setQueryData(['setlists', id], updated);
        },
        onError: () => toast.error('Fehler beim Speichern der Reihenfolge'),
    });

    // Drag-and-drop reorder (HTML5)
    const handleDragStart = (idx: number) => setDraggedIdx(idx);
    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === idx || !setlist) return;
        const items = [...setlist.items];
        const moved = items.splice(draggedIdx, 1)[0];
        items.splice(idx, 0, moved);
        const reordered = items.map((item, pos) => ({ id: item.id, position: pos }));
        setDraggedIdx(idx);
        queryClient.setQueryData(['setlists', id], { ...setlist, items: items.map((it, pos) => ({ ...it, position: pos })) });
        reorderMutation.mutate(reordered);
    };
    const handleDragEnd = () => setDraggedIdx(null);

    const filteredSheetMusic = (sheetMusicList?.sheetMusic ?? []).filter((sm: { title: string; composer?: string | null }) =>
        sm.title.toLowerCase().includes(sheetMusicSearch.toLowerCase()) ||
        (sm.composer ?? '').toLowerCase().includes(sheetMusicSearch.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-4">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    if (!setlist) return null;

    const totalDuration = setlist.items.reduce((sum, it) => sum + (it.duration ?? 0), 0);
    const durationLabel = totalDuration > 0
        ? `${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, '0')} min`
        : null;

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <PageHeader
                title={setlist.name}
                subtitle={setlist.description ?? undefined}
                Icon={ListMusic}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/member/setlists')}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Zurück
                        </Button>
                        {canWrite && (
                            <Button
                                className="h-11 w-11 sm:w-auto sm:px-5 gap-1.5 rounded-2xl shadow-sm"
                                onClick={() => setAddOpen(true)}
                            >
                                <Plus className="h-5 w-5 flex-shrink-0" />
                                <span className="hidden sm:inline">Hinzufügen</span>
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{setlist.items.length} Einträge</Badge>
                {durationLabel && <Badge variant="outline">⏱ {durationLabel}</Badge>}
                {setlist.event && (
                    <Badge variant="outline">📅 {setlist.event.title}</Badge>
                )}
            </div>

            {/* Items list */}
            {setlist.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <Music className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Noch keine Einträge</p>
                    {canWrite && (
                        <Button variant="outline" onClick={() => setAddOpen(true)}>
                            Ersten Eintrag hinzufügen
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {setlist.items.map((item, idx) => (
                        <div
                            key={item.id}
                            draggable={canWrite}
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            className="flex items-center gap-3 rounded-xl border bg-card px-3 py-3 shadow-sm hover:shadow transition-shadow"
                        >
                            <span className="text-muted-foreground text-sm font-mono w-6 text-center select-none">
                                {idx + 1}
                            </span>
                            {canWrite && (
                                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab flex-shrink-0" />
                            )}
                            <div className="flex-shrink-0">{TYPE_ICONS[item.type]}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                    {item.sheetMusic?.title ?? item.title ?? TYPE_LABELS[item.type]}
                                </p>
                                {item.sheetMusic?.composer && (
                                    <p className="text-xs text-muted-foreground truncate">{item.sheetMusic.composer}</p>
                                )}
                                {item.notes && (
                                    <p className="text-xs text-muted-foreground truncate italic">{item.notes}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {item.duration && (
                                    <span className="text-xs text-muted-foreground">
                                        {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                                    </span>
                                )}
                                <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                                    {TYPE_LABELS[item.type]}
                                </Badge>
                                {canWrite && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive/60 hover:text-destructive"
                                        onClick={() => setDeleteTarget(item)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Item Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Eintrag hinzufügen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Typ</Label>
                            <Select
                                value={addForm.type}
                                onValueChange={(v) => setAddForm({ ...addForm, type: v as AddSetlistItemDto['type'] })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sheetMusic">🎵 Stück aus Archiv</SelectItem>
                                    <SelectItem value="pause">☕ Pause</SelectItem>
                                    <SelectItem value="custom">✏️ Benutzerdefiniert</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {addForm.type === 'sheetMusic' && (
                            <div className="space-y-1.5">
                                <Label>Stück suchen</Label>
                                <Input
                                    placeholder="Titel oder Komponist..."
                                    value={sheetMusicSearch}
                                    onChange={(e) => setSheetMusicSearch(e.target.value)}
                                />
                                <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                                    {filteredSheetMusic.slice(0, 20).map((sm: { id: number; title: string; composer?: string | null }) => (
                                        <button
                                            key={sm.id}
                                            type="button"
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${addForm.sheetMusicId === sm.id ? 'bg-primary/10 font-medium' : ''}`}
                                            onClick={() => setAddForm({ ...addForm, sheetMusicId: sm.id, title: sm.title })}
                                        >
                                            <div className="font-medium truncate">{sm.title}</div>
                                            {sm.composer && <div className="text-xs text-muted-foreground">{sm.composer}</div>}
                                        </button>
                                    ))}
                                    {filteredSheetMusic.length === 0 && (
                                        <p className="px-3 py-4 text-sm text-muted-foreground text-center">Keine Stücke gefunden</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {addForm.type !== 'sheetMusic' && (
                            <div className="space-y-1.5">
                                <Label>Bezeichnung</Label>
                                <Input
                                    value={addForm.title}
                                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                                    placeholder={addForm.type === 'pause' ? 'z.B. Pause 15 min' : 'Bezeichnung...'}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Notizen (optional)</Label>
                            <Textarea
                                value={addForm.notes}
                                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                                placeholder="Hinweise, Besetzung, etc."
                                rows={2}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Dauer in Sekunden (optional)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={addForm.duration ?? ''}
                                onChange={(e) => setAddForm({ ...addForm, duration: e.target.value ? parseInt(e.target.value) : undefined })}
                                placeholder="z.B. 240 für 4 Minuten"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>Abbrechen</Button>
                        <Button
                            onClick={() => addMutation.mutate(addForm)}
                            disabled={
                                addMutation.isPending ||
                                (addForm.type === 'sheetMusic' && !addForm.sheetMusicId) ||
                                (addForm.type !== 'sheetMusic' && !addForm.title?.trim())
                            }
                        >
                            Hinzufügen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eintrag entfernen?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground py-2">
                        <strong>{deleteTarget?.sheetMusic?.title ?? deleteTarget?.title ?? 'Dieser Eintrag'}</strong> wird aus der Setlist entfernt.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Abbrechen</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && removeMutation.mutate(deleteTarget.id)}
                            disabled={removeMutation.isPending}
                        >
                            Entfernen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
