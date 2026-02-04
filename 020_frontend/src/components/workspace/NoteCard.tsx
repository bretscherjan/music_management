import { useState } from 'react';
import { Pin, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { renderMentionsText } from '@/components/workspace/MentionInput';
import { FormattedInput } from '@/components/workspace/FormattedInput';
import { MarkdownEditor, renderMarkdownPreview } from '@/components/workspace/MarkdownEditor';
import type { AdminNote } from '@/types/workspace';
import { getAdminColor } from '@/types/workspace';

interface User {
    id: number;
    firstName: string;
    lastName: string;
}

interface NoteCardProps {
    note: AdminNote;
    users: User[];
    onUpdate: (id: number, title?: string, content?: string) => void;
    onDelete: (id: number) => void;
    onPin: (id: number, pinned: boolean) => void;
}

export function NoteCard({ note, users, onUpdate, onDelete, onPin }: NoteCardProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingContent, setIsEditingContent] = useState(false);

    // Internal state for editing
    const [editTitle, setEditTitle] = useState(note.title);
    const [editContent, setEditContent] = useState(note.content);

    const handleSaveTitle = () => {
        if (editTitle.trim() !== note.title) {
            onUpdate(note.id, editTitle.trim(), undefined);
        }
        setIsEditingTitle(false);
    };

    const handleSaveContent = () => {
        if (editContent !== note.content) {
            onUpdate(note.id, undefined, editContent);
        }
        setIsEditingContent(false);
    };

    return (
        <div
            className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow flex flex-col gap-2"
            style={{
                borderLeftWidth: 4,
                borderLeftColor: getAdminColor(note.ownerId),
            }}
        >
            <div className="flex items-start justify-between">
                {/* Inline Title Edit */}
                {isEditingTitle ? (
                    <div className="flex-1 mr-2">
                        <FormattedInput
                            value={editTitle}
                            onChange={setEditTitle}
                            users={users}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle();
                                if (e.key === 'Escape') {
                                    setEditTitle(note.title);
                                    setIsEditingTitle(false);
                                }
                            }}
                            onBlur={handleSaveTitle}
                            className="font-medium"
                            autoFocus
                        />
                    </div>
                ) : (
                    <h3
                        className="font-medium cursor-pointer hover:text-primary flex-1 break-words"
                        onClick={() => {
                            setEditTitle(note.title);
                            setIsEditingTitle(true);
                        }}
                    >
                        {renderMentionsText(note.title)}
                    </h3>
                )}

                <div className="flex gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onPin(note.id, !note.pinned)}
                        title={note.pinned ? "Loslösen" : "Anpinnen"}
                    >
                        <Pin
                            className={`h-4 w-4 ${note.pinned ? 'text-primary fill-primary' : ''
                                }`}
                        />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onDelete(note.id)}
                        title="Löschen"
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Inline Content Edit */}
            {isEditingContent ? (
                <div className="space-y-2 flex-1">
                    <MarkdownEditor
                        value={editContent}
                        onChange={setEditContent}
                        users={users}
                        minHeight="120px"
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setEditContent(note.content);
                                setIsEditingContent(false);
                            }}
                        >
                            Abbrechen
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSaveContent}
                        >
                            Speichern
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 p-2 rounded whitespace-pre-wrap flex-1 min-h-[60px]"
                    onClick={() => {
                        setEditContent(note.content);
                        setIsEditingContent(true);
                    }}
                >
                    {note.content ? renderMarkdownPreview(note.content) : 'Klicken zum Bearbeiten...'}
                </div>
            )}

            <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-muted-foreground border-t">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            className="w-2 h-2 rounded-full cursor-help"
                            style={{ backgroundColor: getAdminColor(note.ownerId) }}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        Erstellt von: {note.owner?.firstName} {note.owner?.lastName}
                    </TooltipContent>
                </Tooltip>
                {note.owner?.firstName}
            </div>
        </div>
    );
}
