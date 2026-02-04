
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { musicFolderService } from '@/services/musicFolderService';
import { sheetMusicService } from '@/services/sheetMusicService';
import { useIsAdmin } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Download, Plus, Trash2, GripVertical, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { MusicFolderItem } from '@/services/musicFolderService';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
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
    const isAdmin = useIsAdmin();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);

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
        if (folder?.items) {
            setItems(folder.items);
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

    const handleSave = () => {
        const sheetIds = items.map(i => i.sheetMusicId);
        updateItemsMutation.mutate(sheetIds);
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
            <div ref={setNodeRef} style={style} className="bg-white p-3 rounded-lg border shadow-sm flex items-center gap-3">
                {editMode && (
                    <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                        <GripVertical className="h-5 w-5" />
                    </div>
                )}

                <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.sheetMusic.title}</h3>
                    <p className="text-sm text-gray-500">
                        {item.sheetMusic.composer}
                        {item.sheetMusic.arranger && ` • Arr. ${item.sheetMusic.arranger}`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {editMode && (
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Laden...</div>;
    if (!folder) return <div className="p-8 text-center text-red-500">Fehler beim Laden</div>;

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            {/* Header */}
            <div className="bg-white border-b p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm z-10 sticky top-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-all">{folder.name}</h1>
                    {folder.description && <p className="text-gray-500 mt-1 text-sm">{folder.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                    {isAdmin && !editMode && (
                        <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                            Bearbeiten
                        </Button>
                    )}
                    {isAdmin && editMode && (
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
                                            className="w-full p-2 border rounded"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 overflow-y-auto py-4">
                                        <div className="space-y-2">
                                            {allSheetMusic?.sheetMusic
                                                .filter(s => !items.some(i => i.sheetMusicId === s.id))
                                                .map(sheet => (
                                                    <div key={sheet.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border">
                                                        <div>
                                                            <div className="font-medium">{sheet.title}</div>
                                                            <div className="text-xs text-gray-500">{sheet.composer}</div>
                                                        </div>
                                                        <Button size="sm" variant="ghost" onClick={() => handleAddItem(sheet)}>
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
                                setItems(folder.items || []); // Reset
                            }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {!editMode && (
                        <>
                            {isAdmin && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="sm:hidden"
                                    onClick={() => {
                                        if (confirm('Möchten Sie diese Mappe wirklich löschen?')) {
                                            deleteFolderMutation.mutate(folderId);
                                        }
                                    }}
                                    disabled={deleteFolderMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                            {isAdmin && (
                                <Button
                                    variant="destructive"
                                    className="hidden sm:flex"
                                    onClick={() => {
                                        if (confirm('Möchten Sie diese Mappe wirklich löschen?')) {
                                            deleteFolderMutation.mutate(folderId);
                                        }
                                    }}
                                    disabled={deleteFolderMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Löschen
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={async () => {
                                    try {
                                        const blob = await musicFolderService.exportPdf(folderId);
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
                            >
                                <Download className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Liste als PDF</span>
                                <span className="sm:hidden">PDF</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6">
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
                        <div className="max-w-4xl mx-auto space-y-3">
                            {items.map((item) => (
                                <SortableItem key={item.id} item={item} />
                            ))}
                            {items.length === 0 && (
                                <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                                    Diese Mappe ist noch leer
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

        </div>
    );
};
