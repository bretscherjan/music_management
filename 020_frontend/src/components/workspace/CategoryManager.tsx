import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash, Edit, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import workspaceService from '@/services/workspaceService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

import type { TaskCategory, CreateCategoryDto, UpdateCategoryDto } from '@/types/workspace';

interface CategoryManagerProps {
    open: boolean;
    onClose: () => void;
    categories: TaskCategory[];
}

function SortableCategoryRow({
    category,
    editingId,
    startEditing,
    setEditingId,
    editName,
    setEditName,
    editColor,
    setEditColor,
    handleUpdate,
    deleteMutation
}: {
    category: TaskCategory;
    editingId: number | null;
    startEditing: (cat: TaskCategory) => void;
    setEditingId: (id: number | null) => void;
    editName: string;
    setEditName: (v: string) => void;
    editColor: string;
    setEditColor: (v: string) => void;
    handleUpdate: () => void;
    deleteMutation: any;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 2 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 p-2 rounded bg-muted/50 mb-2"
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-move p-1 hover:bg-muted rounded touch-none"
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color || '#3B82F6' }}
            />

            {editingId === category.id ? (
                <>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-8"
                    />
                    <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <Button size="sm" onClick={handleUpdate}>
                        OK
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                    >
                        ✕
                    </Button>
                </>
            ) : (
                <>
                    <span className="flex-1 font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground mr-2">
                        {category._count?.tasks || 0} Tasks
                    </span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEditing(category)}
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                            if (confirm('Kategorie wirklich löschen?')) {
                                deleteMutation.mutate(category.id);
                            }
                        }}
                    >
                        <Trash className="h-3 w-3" />
                    </Button>
                </>
            )}
        </div>
    );
}

export function CategoryManager({ open, onClose, categories }: CategoryManagerProps) {
    const queryClient = useQueryClient();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    // Local state for dragging to prevent jitter
    // We should sync this with props.categories when not dragging, but dnd-kit handles this usually via reorders
    // For simplicity, we can just use the mutations directly or optimistic update on the parent.
    // However, SortableContext needs a local stable list if we want immediate feedback before server confirms.
    // But since `categories` prop comes from parent RQ state, we just need to fire the mutation and let strict mode/optimistic logic handle it.
    // Ideally parent handles the order. logic.
    // Let's implement handlesDragEnd here similar to parent.

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

    // Reorder mutation
    const reorderMutation = useMutation({
        mutationFn: (newOrder: { id: number; position: number }[]) =>
            workspaceService.reorderCategories(newOrder),
        onSuccess: () => {
            // Parent usually refetches or invalidates
            queryClient.invalidateQueries({ queryKey: ['workspace', 'categories'] });
        },
        onError: () => toast.error('Fehler beim Sortieren'),
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = categories.findIndex((c) => c.id === active.id);
        const newIndex = categories.findIndex((c) => c.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newCategories = arrayMove(categories, oldIndex, newIndex);

            // Optimistic update global cache
            queryClient.setQueryData(['workspace', 'categories'], { categories: newCategories });

            const payload = newCategories.map((c, i) => ({
                id: c.id,
                position: i,
            }));
            reorderMutation.mutate(payload);
        }
    };


    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateCategoryDto) => workspaceService.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'categories'] });
            toast.success('Kategorie erstellt');
            setNewCategoryName('');
            setNewCategoryColor('#3B82F6');
        },
        onError: () => toast.error('Fehler beim Erstellen'),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCategoryDto }) =>
            workspaceService.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'categories'] });
            toast.success('Kategorie aktualisiert');
            setEditingId(null);
        },
        onError: () => toast.error('Fehler beim Aktualisieren'),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => workspaceService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'categories'] });
            toast.success('Kategorie gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen'),
    });

    const handleCreate = () => {
        if (!newCategoryName.trim()) return;
        createMutation.mutate({
            name: newCategoryName.trim(),
            color: newCategoryColor,
        });
    };

    const startEditing = (cat: TaskCategory) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditColor(cat.color || '#3B82F6');
    };

    const handleUpdate = () => {
        if (!editingId || !editName.trim()) return;
        updateMutation.mutate({
            id: editingId,
            data: { name: editName.trim(), color: editColor },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Kategorien verwalten</DialogTitle>
                    <DialogDescription>
                        Erstelle, bearbeite oder lösche Kategorien für deine Tasks. Drag & Drop zum Sortieren.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* New Category Form */}
                    <div className="flex gap-2">
                        <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Neue Kategorie..."
                            className="flex-1"
                        />
                        <input
                            type="color"
                            value={newCategoryColor}
                            onChange={(e) => setNewCategoryColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Button
                            onClick={handleCreate}
                            disabled={!newCategoryName.trim() || createMutation.isPending}
                            size="icon"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Category List Sortable */}
                    <div className="max-h-96 overflow-y-auto pr-2">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={categories.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {categories.map((cat) => (
                                    <SortableCategoryRow
                                        key={cat.id}
                                        category={cat}
                                        editingId={editingId}
                                        startEditing={startEditing}
                                        setEditingId={setEditingId}
                                        editName={editName}
                                        setEditName={setEditName}
                                        editColor={editColor}
                                        setEditColor={setEditColor}
                                        handleUpdate={handleUpdate}
                                        deleteMutation={deleteMutation}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Schliessen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
