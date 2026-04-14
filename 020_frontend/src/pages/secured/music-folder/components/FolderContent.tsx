
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { musicFolderService } from '@/services/musicFolderService';
import { sheetMusicService } from '@/services/sheetMusicService';
import { useCan } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Download, Plus, Trash2, GripVertical, Save, X, Loader2, Music } from 'lucide-react';
import { PdfExportDialog } from '@/components/ui/PdfExportDialog';
import type { PdfOptions } from '@/utils/pdfTheme';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { MusicFolderItem } from '@/services/musicFolderService';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FolderContentProps {
    folderId: number;
}

export const FolderContent = ({ folderId }: FolderContentProps) => {
    const can = useCan();
    const canManageFolders = can('folders:write');
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState<string | undefined>('');

    const deleteFolderMutation = useMutation({
        mutationFn: (id: number) => musicFolderService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['musicFolders'] });
            toast.success('Mappe gelöscht');
            navigate('/member/music-folders');
        },
        onError: () => toast.error('Fehler beim Löschen der Mappe')
    });

    // Fetch Folder Data
    const { data: folder, isLoading } = useQuery({
        queryKey: ['musicFolder', folderId],
        queryFn: () => musicFolderService.getById(folderId)
    });

    const [searchTerm, setSearchTerm] = useState('');

    // Fetch All Sheet Music (for selection dialog)
    const { data: allSheetMusic } = useQuery({
        queryKey: ['allSheetMusic', searchTerm], // Refetch/filter doesn't really work with client side filtering of full list, but good for future.
        // Actually, for now we fetch all and filter client side as requested in previous steps?
        // Wait, the hook below fetched limit 1000.
        queryFn: () => sheetMusicService.getAll({ limit: 1000, search: searchTerm }),
        enabled: editMode // only fetch when editing
    });

    // Local state for items (for optimistic UI updates during drag)
    const [items, setItems] = useState<MusicFolderItem[]>([]);

    // Sync items when folder loads
    useMemo(() => {
        if (folder) {
            if (folder.items) {
                setItems(folder.items);
            }
            setEditedName(folder.name);
            setEditedDescription(folder.description);
        }
    }, [folder]);

    // Mutation for saving order/items
    const updateItemsMutation = useMutation({
        mutationFn: (sheetIds: number[]) => musicFolderService.setItems(folderId, sheetIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['musicFolder', folderId] });
            toast.success('Mappe gespeichert');
            setEditMode(false);
        },
        onError: () => toast.error('Fehler beim Speichern')
    });

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSave = async () => {
        if (!folder) return;
        try {
            // Save items order/selection
            const sheetIds = items.map(i => i.sheetMusicId);
            await updateItemsMutation.mutateAsync(sheetIds);

            // Save folder name/description if changed
            if (editedName !== folder.name || editedDescription !== folder.description) {
                await musicFolderService.update(folderId, {
                    name: editedName,
                    description: editedDescription
                });
                queryClient.invalidateQueries({ queryKey: ['musicFolders'] });
                queryClient.invalidateQueries({ queryKey: ['musicFolder', folderId] });
            }

            setEditMode(false);
        } catch (error) {
            // Error handling already done in mutations, but just in case
        }
    };

    const handleAddItem = (sheet: any) => {
        // optimistically add to list
        const newItem: MusicFolderItem = {
            id: Date.now(), // temp id
            folderId,
            sheetMusicId: sheet.id,
            position: items.length,
            sheetMusic: sheet
        };
        setItems([...items, newItem]);
    };

    const handleRemoveItem = (itemId: number) => {
        setItems(items.filter(i => i.id !== itemId));
    };

    const SortableItem = ({ item }: { item: MusicFolderItem }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
        } = useSortable({ id: item.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        return (
            <div ref={setNodeRef} style={style} className={`bg-card p-4 rounded-xl border shadow-sm flex items-center gap-3 transition-colors ${editMode ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                {editMode && (
                    <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground touch-none p-2 -ml-2 active:text-primary">
                        <GripVertical className="h-6 w-6" />
                    </div>
                )}

                <div className="flex-1">
                    <h3 className="font-semibold text-sm text-foreground">{item.sheetMusic.title}</h3>
                    <p className="text-xs text-muted-foreground">
                        {item.sheetMusic.composer}
                        {item.sheetMusic.arranger && ` · Arr. ${item.sheetMusic.arranger}`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {editMode && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    if (isLoading) return (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Lade Mappe...</p>
            </div>
        </div>
    );
    if (!folder) return (
        <div className="flex-1 flex items-center justify-center p-8 text-destructive text-sm">
            Fehler beim Laden
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Sticky header */}
            <div className="bg-card border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-10">
                <div className="flex-1 min-w-0">
                    {editMode ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="text-lg sm:text-xl font-bold bg-muted/30 border rounded-xl px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Name der Mappe"
                            />
                            <input
                                type="text"
                                value={editedDescription || ''}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                className="text-sm text-muted-foreground bg-muted/30 border rounded-xl px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Beschreibung (optional)"
                            />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-lg sm:text-xl font-bold break-all">{folder.name}</h1>
                            {folder.description && <p className="text-muted-foreground mt-0.5 text-sm">{folder.description}</p>}
                        </>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {canManageFolders && !editMode && (
                        <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                            Bearbeiten
                        </Button>
                    )}
                    {canManageFolders && editMode && (
                        <>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    if (confirm('Möchten Sie diese Mappe wirklich löschen?')) {
                                        deleteFolderMutation.mutate(folderId);
                                    }
                                }}
                                disabled={deleteFolderMutation.isPending}
                            >
                                <Trash2 className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Mappe Löschen</span>
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" size="sm">
                                        <Plus className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Stück hinzufügen</span>
                                        <span className="sm:hidden">Neu</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>Stück hinzufügen</DialogTitle>
                                    </DialogHeader>
                                    <div className="px-4 pb-2">
                                        <input
                                            type="text"
                                            placeholder="Suchen..."
                                            className="w-full h-11 px-4 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 overflow-y-auto py-4">
                                        <div className="space-y-2">
                                            {allSheetMusic?.sheetMusic
                                                .filter(s => !items.some(i => i.sheetMusicId === s.id))
                                                .map(sheet => (
                                                    <div key={sheet.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl border transition-colors">
                                                        <div>
                                                            <div className="font-medium text-sm">{sheet.title}</div>
                                                            <div className="text-xs text-muted-foreground">{sheet.composer}</div>
                                                        </div>
                                                        <Button size="sm" variant="ghost" className="text-primary" onClick={() => handleAddItem(sheet)}>
                                                            Hinzufügen
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button size="sm" onClick={handleSave} disabled={updateItemsMutation.isPending}>
                                <Save className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Speichern</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                                setEditMode(false);
                                if (folder) {
                                    setItems(folder.items || []);
                                    setEditedName(folder.name);
                                    setEditedDescription(folder.description);
                                }
                            }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {!editMode && (
                        <>
                            {canManageFolders && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        if (confirm('Möchten Sie diese Mappe wirklich löschen?')) {
                                            deleteFolderMutation.mutate(folderId);
                                        }
                                    }}
                                    disabled={deleteFolderMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Löschen</span>
                                </Button>
                            )}
                            <PdfExportDialog
                                trigger={
                                    <Button size="sm">
                                        <Download className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Liste als PDF</span>
                                        <span className="sm:hidden">PDF</span>
                                    </Button>
                                }
                                title="Mappe als PDF exportieren"
                                onExport={async (opts: PdfOptions) => {
                                    try {
                                        const blob = await musicFolderService.exportPdf(folderId, opts);
                                        const url = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `${folder.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.parentNode?.removeChild(link);
                                    } catch (e) {
                                        toast.error('Fehler beim Exportieren des PDFs');
                                    }
                                }}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Item list */}
            <div className="flex-1 overflow-y-auto p-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                        disabled={!editMode}
                    >
                        <div className="max-w-3xl mx-auto space-y-3">
                            {items.map((item) => (
                                <SortableItem key={item.id} item={item} />
                            ))}
                            {items.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                        <Music className="h-8 w-8 text-muted-foreground/40" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">Mappe ist leer</p>
                                        {canManageFolders && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Klicke auf «Bearbeiten» um Stücke hinzuzufügen
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};
