import { useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

import workspaceService from '@/services/workspaceService';
import eventService from '@/services/eventService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import type { Task, TaskCategory, CreateTaskDto, UpdateTaskDto } from '@/types/workspace';

interface TaskFormProps {
    open: boolean;
    onClose: () => void;
    task?: Task | null;
    categories: TaskCategory[];
    defaultCategoryId?: number | null;
}

export function TaskForm({ open, onClose, task, categories, defaultCategoryId }: TaskFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!task;

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<{
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        dueDate: string;
        categoryId: string;
        eventId: string;
        parentId: string;
    }>({
        defaultValues: {
            title: task?.title || '',
            description: task?.description || '',
            priority: task?.priority || 'medium',
            dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
            categoryId: (task?.categoryId || defaultCategoryId || categories[0]?.id || '').toString(),
            eventId: task?.eventId?.toString() || '',
            parentId: task?.parentId?.toString() || '',
        },
    });

    // Fetch events for linking
    const { data: eventsData } = useQuery({
        queryKey: ['events'],
        queryFn: () => eventService.getAll(),
        staleTime: 5 * 60 * 1000,
    });

    // Fetch tasks for parent selection
    const { data: tasksData } = useQuery({
        queryKey: ['workspace', 'tasks', 'all'],
        queryFn: () => workspaceService.getTasks({ includeCompleted: true }),
        staleTime: 5 * 60 * 1000,
    });

    const events = eventsData || [];
    const allTasks = tasksData?.tasks || [];

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateTaskDto) => workspaceService.createTask(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            toast.success('Task erstellt');
            onClose();
        },
        onError: () => toast.error('Fehler beim Erstellen'),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: UpdateTaskDto) => workspaceService.updateTask(task!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            toast.success('Task aktualisiert');
            onClose();
        },
        onError: () => toast.error('Fehler beim Aktualisieren'),
    });

    const onSubmit = (data: {
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        dueDate: string;
        categoryId: string;
        eventId: string;
        parentId: string;
    }) => {
        const payload = {
            title: data.title,
            description: data.description || undefined,
            priority: data.priority,
            dueDate: data.dueDate || null,
            categoryId: parseInt(data.categoryId),
            eventId: data.eventId ? parseInt(data.eventId) : null,
            parentId: data.parentId ? parseInt(data.parentId) : null,
        };

        if (isEditing) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload as CreateTaskDto);
        }
    };

    useEffect(() => {
        if (open) {
            reset({
                title: task?.title || '',
                description: task?.description || '',
                priority: task?.priority || 'medium',
                dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
                categoryId: (task?.categoryId || defaultCategoryId || categories[0]?.id || '').toString(),
                eventId: task?.eventId?.toString() || '',
                parentId: task?.parentId?.toString() || '',
            });
        }
    }, [open, task, defaultCategoryId, categories, reset]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Task bearbeiten' : 'Neuer Task'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium">Titel *</label>
                        <Input
                            {...register('title', { required: 'Titel ist erforderlich' })}
                            placeholder="Task-Titel"
                            className="mt-1"
                        />
                        {errors.title && (
                            <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium">Beschreibung</label>
                        <textarea
                            {...register('description')}
                            placeholder="Optionale Beschreibung..."
                            className="mt-1 w-full min-h-20 p-2 rounded-md border border-input bg-background text-sm"
                        />
                    </div>

                    {/* Priority & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Priorität</label>
                            <Select
                                value={watch('priority')}
                                onValueChange={(val) => setValue('priority', val as 'low' | 'medium' | 'high')}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Niedrig</SelectItem>
                                    <SelectItem value="medium">Mittel</SelectItem>
                                    <SelectItem value="high">Hoch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Kategorie *</label>
                            <Select
                                value={watch('categoryId')}
                                onValueChange={(val) => setValue('categoryId', val)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="text-sm font-medium">Fälligkeitsdatum (optional)</label>
                        <Input
                            type="date"
                            {...register('dueDate')}
                            className="mt-1"
                        />
                    </div>

                    {/* Event Link */}
                    <div>
                        <label className="text-sm font-medium">Mit Event verknüpfen (optional)</label>
                        <Select
                            value={watch('eventId')}
                            onValueChange={(val) => setValue('eventId', val)}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Kein Event" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Kein Event</SelectItem>
                                {events.slice(0, 20).map((event: { id: number; title: string }) => (
                                    <SelectItem key={event.id} value={event.id.toString()}>
                                        {event.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Parent Task (Subtask) */}
                    <div>
                        <label className="text-sm font-medium">Übergeordneter Task (für Subtask)</label>
                        <Select
                            value={watch('parentId')}
                            onValueChange={(val) => setValue('parentId', val)}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Kein übergeordneter Task" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Kein übergeordneter Task</SelectItem>
                                {allTasks
                                    .filter((t) => t.id !== task?.id)
                                    .map((t) => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            {t.title}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Speichern...' : isEditing ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
