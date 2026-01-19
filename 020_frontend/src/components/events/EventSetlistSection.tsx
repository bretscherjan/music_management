import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { sheetMusicService, eventService } from '@/services';
import type { Event, EventSetlistItem, AddSetlistItemDto, UpdateSetlistItemDto } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Music, Search, GripVertical, Edit2, Trash2, Clock, FileText, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface EventSetlistSectionProps {
    event: Event;
    isAdmin: boolean;
}

export function EventSetlistSection({ event, isAdmin }: EventSetlistSectionProps) {
    const queryClient = useQueryClient();
    const [sheetMusicDialogOpen, setSheetMusicDialogOpen] = useState(false);
    const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<EventSetlistItem | null>(null);

    // Form states
    const [pauseMinutes, setPauseMinutes] = useState(15);
    const [customTitle, setCustomTitle] = useState('');
    const [customDescription, setCustomDescription] = useState('');

    // Drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Query all sheet music for selection dialog
    const { data: allSheetMusic } = useQuery({
        queryKey: ['sheetMusic', { search, limit: 100 }],
        queryFn: () => sheetMusicService.getAll({ search, limit: 100 }),
        enabled: sheetMusicDialogOpen && isAdmin,
    });

    // Mutations
    const addMutation = useMutation({
        mutationFn: (data: AddSetlistItemDto) => eventService.addSetlistItem(event.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', event.id] });
            toast.success('Element zum Programm hinzugefügt');
            setSheetMusicDialogOpen(false);
            setPauseDialogOpen(false);
            setCustomDialogOpen(false);
            setSearch('');
            resetCustomForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Fehler beim Hinzufügen');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ itemId, data }: { itemId: number; data: UpdateSetlistItemDto }) =>
            eventService.updateSetlistItem(event.id, itemId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', event.id] });
            toast.success('Element aktualisiert');
            setEditDialogOpen(false);
            setSelectedItem(null);
            resetCustomForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Fehler beim Aktualisieren');
        },
    });

    const removeMutation = useMutation({
        mutationFn: (itemId: number) => eventService.removeSetlistItem(event.id, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', event.id] });
            toast.success('Element aus dem Programm entfernt');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Fehler beim Entfernen');
        },
    });

    const reorderMutation = useMutation({
        mutationFn: (items: Array<{ id: number; position: number }>) =>
            eventService.reorderSetlist(event.id, { items }),
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Fehler beim Sortieren');
            queryClient.invalidateQueries({ queryKey: ['event', event.id] });
        },
    });

    const handleRemove = (item: EventSetlistItem) => {
        const title = item.type === 'sheetMusic' ? item.sheetMusic?.title : item.customTitle;
        if (confirm(`Möchten Sie "${title}" wirklich aus dem Programm entfernen?`)) {
            removeMutation.mutate(item.id);
        }
    };

    const handleEdit = (item: EventSetlistItem) => {
        setSelectedItem(item);
        setCustomTitle(item.customTitle || '');
        setCustomDescription(item.customDescription || '');
        setPauseMinutes(item.duration || 15);
        setEditDialogOpen(true);
    };

    const handleDragEnd = (dragEvent: DragEndEvent) => {
        const { active, over } = dragEvent;

        if (over && active.id !== over.id) {
            const items = event.setlist || [];
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);

            // Optimistic update
            queryClient.setQueryData(['event', event.id], (old: any) => ({
                ...old,
                setlist: newItems.map((item, idx) => ({ ...item, position: idx })),
            }));

            // Server update
            reorderMutation.mutate(newItems.map((item, idx) => ({ id: item.id, position: idx })));
        }
    };

    const alreadyInSetlist = (sheetMusicId: number) => {
        return event.setlist?.some((item) => item.type === 'sheetMusic' && item.sheetMusicId === sheetMusicId);
    };

    const resetCustomForm = () => {
        setCustomTitle('');
        setCustomDescription('');
        setPauseMinutes(15);
    };

    const sortedSetlist = [...(event.setlist || [])].sort((a, b) => a.position - b.position);

    return (
        <div className="mt-6 border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Programm / Setlist</h3>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Dialog open={sheetMusicDialogOpen} onOpenChange={setSheetMusicDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Music className="h-4 w-4 mr-2" />
                                    Note
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh]">
                                <DialogHeader>
                                    <DialogTitle>Note zum Programm hinzufügen</DialogTitle>
                                    <DialogDescription>
                                        Suchen Sie nach Notenblättern im Archiv und fügen Sie sie hinzu.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Note suchen..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                                        {allSheetMusic?.sheetMusic.map((sheet) => (
                                            <div
                                                key={sheet.id}
                                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{sheet.title}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {sheet.composer && `${sheet.composer} • `}
                                                        {sheet.genre || 'Kein Genre'}
                                                        {sheet.difficulty && ` • ${sheet.difficulty}`}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        addMutation.mutate({ type: 'sheetMusic', sheetMusicId: sheet.id })
                                                    }
                                                    disabled={alreadyInSetlist(sheet.id) || addMutation.isPending}
                                                >
                                                    {alreadyInSetlist(sheet.id) ? 'Bereits im Programm' : 'Hinzufügen'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Pause hinzufügen</DialogTitle>
                                    <DialogDescription>
                                        Fügen Sie eine Pause mit einer bestimmten Dauer ein.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Dauer (Minuten)</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={pauseMinutes}
                                            onChange={(e) => setPauseMinutes(parseInt(e.target.value) || 15)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={() =>
                                            addMutation.mutate({
                                                type: 'pause',
                                                customTitle: 'Pause',
                                                duration: pauseMinutes,
                                            })
                                        }
                                        disabled={addMutation.isPending}
                                    >
                                        {addMutation.isPending ? 'Hinzufügen...' : 'Hinzufügen'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Eigenes Element
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Eigenes Element erstellen</DialogTitle>
                                    <DialogDescription>
                                        Erstellen Sie ein benutzerdefiniertes Element für Ansagen oder Moderationen.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Titel *</Label>
                                        <Input
                                            value={customTitle}
                                            onChange={(e) => setCustomTitle(e.target.value)}
                                            placeholder="z.B. Ansage, Vorstellung, Moderation"
                                        />
                                    </div>
                                    <div>
                                        <Label>Beschreibung</Label>
                                        <Textarea
                                            value={customDescription}
                                            onChange={(e) => setCustomDescription(e.target.value)}
                                            placeholder="Optional..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={() =>
                                            addMutation.mutate({
                                                type: 'custom',
                                                customTitle,
                                                customDescription: customDescription || undefined,
                                            })
                                        }
                                        disabled={!customTitle || addMutation.isPending}
                                    >
                                        {addMutation.isPending ? 'Erstellen...' : 'Erstellen'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {sortedSetlist.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sortedSetlist.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {sortedSetlist.map((item, index) => (
                                <SetlistItem
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    isAdmin={isAdmin}
                                    onEdit={handleEdit}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Elemente im Programm</p>
                    {isAdmin && <p className="text-sm">Fügen Sie Noten, Pausen oder eigene Elemente hinzu</p>}
                </div>
            )}

            {/* Edit Dialog */}
            {selectedItem && (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedItem.type === 'pause' ? 'Pause bearbeiten' : 'Element bearbeiten'}
                            </DialogTitle>
                            <DialogDescription>
                                Ändern Sie die Details des ausgewählten Elements.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {selectedItem.type === 'pause' ? (
                                <div>
                                    <Label>Dauer (Minuten)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={pauseMinutes}
                                        onChange={(e) => setPauseMinutes(parseInt(e.target.value) || 15)}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <Label>Titel {selectedItem.type === 'sheetMusic' && '(Optional, überschreibt Original)'}</Label>
                                        <Input
                                            value={customTitle}
                                            onChange={(e) => setCustomTitle(e.target.value)}
                                            placeholder={selectedItem.type === 'sheetMusic' ? selectedItem.sheetMusic?.title : ''}
                                        />
                                    </div>
                                    <div>
                                        <Label>Beschreibung</Label>
                                        <Textarea
                                            value={customDescription}
                                            onChange={(e) => setCustomDescription(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <Label>Dauer (Minuten)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={pauseMinutes}
                                            onChange={(e) => setPauseMinutes(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={() => {
                                    const data: UpdateSetlistItemDto = {};
                                    if (selectedItem.type === 'pause') {
                                        data.duration = pauseMinutes;
                                    } else {
                                        data.customTitle = customTitle;
                                        data.customDescription = customDescription || undefined;
                                        data.duration = pauseMinutes || undefined;
                                    }
                                    updateMutation.mutate({ itemId: selectedItem.id, data });
                                }}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? 'Speichern...' : 'Speichern'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

// Sortable item component
interface SetlistItemProps {
    item: EventSetlistItem;
    index: number;
    isAdmin: boolean;
    onEdit: (item: EventSetlistItem) => void;
    onRemove: (item: EventSetlistItem) => void;
}

function SetlistItem({ item, index, isAdmin, onEdit, onRemove }: SetlistItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-3 border rounded-lg bg-background"
        >
            {isAdmin && (
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
            )}
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {index + 1}
            </div>

            {item.type === 'sheetMusic' && item.sheetMusic ? (
                <>
                    <Music className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                        <div className="font-medium">
                            {item.customTitle || item.sheetMusic.title}
                            {item.customTitle && <span className="text-xs text-muted-foreground ml-2">(Original: {item.sheetMusic.title})</span>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {item.customDescription && <div className="mb-1 italic">{item.customDescription}</div>}
                            {item.sheetMusic.composer && <span>{item.sheetMusic.composer}</span>}
                            {item.sheetMusic.composer && item.sheetMusic.arranger && <span> • Arr.: {item.sheetMusic.arranger}</span>}
                            {!item.sheetMusic.composer && item.sheetMusic.arranger && <span>Arr.: {item.sheetMusic.arranger}</span>}
                            {item.duration && <span> • {item.duration} Min.</span>}
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        {item.sheetMusic.genre && <Badge variant="secondary">{item.sheetMusic.genre}</Badge>}
                        {item.sheetMusic.difficulty && (
                            <Badge
                                variant={
                                    item.sheetMusic.difficulty === 'easy'
                                        ? 'secondary'
                                        : item.sheetMusic.difficulty === 'medium'
                                            ? 'default'
                                            : 'destructive'
                                }
                            >
                                {item.sheetMusic.difficulty === 'easy'
                                    ? 'Leicht'
                                    : item.sheetMusic.difficulty === 'medium'
                                        ? 'Mittel'
                                        : 'Schwer'}
                            </Badge>
                        )}
                        {isAdmin && (
                            <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </>
            ) : item.type === 'pause' ? (
                <>
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div className="flex-1">
                        <div className="font-medium">Pause</div>
                        <div className="text-sm text-muted-foreground">{item.duration} Minuten</div>
                    </div>
                    {isAdmin && (
                        <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    )}
                </>
            ) : (
                <>
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                        <div className="font-medium">{item.customTitle}</div>
                        {item.customDescription && (
                            <div className="text-sm text-muted-foreground">{item.customDescription}</div>
                        )}
                    </div>
                    {isAdmin && (
                        <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    )}
                </>
            )
            }

            {
                isAdmin && (
                    <Button size="icon" variant="ghost" onClick={() => onRemove(item)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )
            }
        </div >
    );
}
