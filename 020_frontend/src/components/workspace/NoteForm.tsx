import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Pin, PinOff } from 'lucide-react';

import workspaceService from '@/services/workspaceService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

import type { AdminNote, CreateNoteDto, UpdateNoteDto } from '@/types/workspace';

interface NoteFormProps {
    open: boolean;
    onClose: () => void;
    note?: AdminNote | null;
}

export function NoteForm({ open, onClose, note }: NoteFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!note;
    const [isPinned, setIsPinned] = useState(note?.pinned || false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<{
        title: string;
        content: string;
    }>({
        defaultValues: {
            title: note?.title || '',
            content: note?.content || '',
        },
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateNoteDto) => workspaceService.createNote(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
            toast.success('Notiz erstellt');
            onClose();
        },
        onError: () => toast.error('Fehler beim Erstellen'),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: UpdateNoteDto) => workspaceService.updateNote(note!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
            toast.success('Notiz aktualisiert');
            onClose();
        },
        onError: () => toast.error('Fehler beim Aktualisieren'),
    });

    const onSubmit = (data: { title: string; content: string }) => {
        const payload = {
            title: data.title,
            content: data.content,
            pinned: isPinned,
        };

        if (isEditing) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload as CreateNoteDto);
        }
    };

    useEffect(() => {
        if (open) {
            reset({
                title: note?.title || '',
                content: note?.content || '',
            });
            setIsPinned(note?.pinned || false);
        }
    }, [open, note, reset]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{isEditing ? 'Notiz bearbeiten' : 'Neue Notiz'}</span>
                        <Button
                            type="button"
                            variant={isPinned ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setIsPinned(!isPinned)}
                            className="h-8 w-8"
                        >
                            {isPinned ? (
                                <Pin className="h-4 w-4" />
                            ) : (
                                <PinOff className="h-4 w-4" />
                            )}
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium">Titel *</label>
                        <Input
                            {...register('title', { required: 'Titel ist erforderlich' })}
                            placeholder="Notiz-Titel"
                            className="mt-1"
                        />
                        {errors.title && (
                            <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Content */}
                    <div>
                        <label className="text-sm font-medium">Inhalt</label>
                        <textarea
                            {...register('content')}
                            placeholder="Notiz-Inhalt..."
                            className="mt-1 w-full min-h-[300px] p-3 rounded-md border border-input bg-background text-sm font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Markdown wird unterstützt
                        </p>
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
