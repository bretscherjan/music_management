import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Edit,
    MoreHorizontal,
    Pin,
    PinOff,
    Trash,
    User,
} from 'lucide-react';

import workspaceService from '@/services/workspaceService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { AdminNote } from '@/types/workspace';
import { getAdminColor } from '@/types/workspace';

interface NoteListProps {
    notes: AdminNote[];
    isLoading: boolean;
    onEdit: (note: AdminNote) => void;
    onRefresh: () => void;
}

export function NoteList({ notes, isLoading, onEdit }: NoteListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (notes.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Keine Notizen vorhanden. Erstelle eine neue Notiz!
            </div>
        );
    }

    // Group notes: pinned first, then by owner
    const pinnedNotes = notes.filter((n) => n.pinned);
    const unpinnedNotes = notes.filter((n) => !n.pinned);

    // Group unpinned by owner (tabs style mentioned by user)
    const notesByOwner = unpinnedNotes.reduce((acc, note) => {
        const ownerId = note.ownerId;
        if (!acc[ownerId]) {
            acc[ownerId] = {
                owner: note.owner,
                notes: [],
            };
        }
        acc[ownerId].notes.push(note);
        return acc;
    }, {} as Record<number, { owner: { id: number; firstName: string; lastName: string }; notes: AdminNote[] }>);

    return (
        <div className="space-y-6">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Pin className="h-4 w-4" />
                        Angepinnt
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pinnedNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Notes grouped by owner */}
            {Object.entries(notesByOwner).map(([ownerId, { owner, notes: ownerNotes }]) => (
                <div key={ownerId}>
                    <h3
                        className="text-sm font-medium mb-3 flex items-center gap-2"
                        style={{ color: getAdminColor(owner.id) }}
                    >
                        <User className="h-4 w-4" />
                        {owner.firstName} {owner.lastName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ownerNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface NoteCardProps {
    note: AdminNote;
    onEdit: (note: AdminNote) => void;
}

function NoteCard({ note, onEdit }: NoteCardProps) {
    const queryClient = useQueryClient();

    // Pin mutation
    const pinMutation = useMutation({
        mutationFn: () => workspaceService.pinNote(note.id, !note.pinned),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
            toast.success(note.pinned ? 'Notiz losgelöst' : 'Notiz angepinnt');
        },
        onError: () => toast.error('Fehler'),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => workspaceService.deleteNote(note.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
            toast.success('Notiz gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen'),
    });

    // Determine primary contributor color
    const primaryColor = getAdminColor(note.primaryContributorId || note.ownerId);

    return (
        <Card
            className="hover:shadow-md transition-shadow cursor-pointer relative"
            style={{ borderLeftColor: primaryColor, borderLeftWidth: 4 }}
            onClick={() => onEdit(note)}
        >
            {note.pinned && (
                <Pin
                    className="absolute top-2 right-2 h-4 w-4 text-primary"
                />
            )}
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                    <span className="truncate">{note.title}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => onEdit(note)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => pinMutation.mutate()}>
                                {note.pinned ? (
                                    <>
                                        <PinOff className="h-4 w-4 mr-2" />
                                        Loslösen
                                    </>
                                ) : (
                                    <>
                                        <Pin className="h-4 w-4 mr-2" />
                                        Anpinnen
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => deleteMutation.mutate()}
                                className="text-destructive"
                            >
                                <Trash className="h-4 w-4 mr-2" />
                                Löschen
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.content || 'Keine Inhalte'}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getAdminColor(note.ownerId) }}
                    />
                    {note.owner.firstName}
                    {note.contributions && note.contributions.length > 1 && (
                        <span>+{note.contributions.length - 1} weitere</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
