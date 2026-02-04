import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';
import { Search, ListTodo, FileText } from 'lucide-react';

import workspaceService from '@/services/workspaceService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import type { Task, AdminNote } from '@/types/workspace';
import { getAdminColor, getPriorityColor } from '@/types/workspace';

interface SearchDialogProps {
    open: boolean;
    onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);

    const { data, isLoading } = useQuery({
        queryKey: ['workspace', 'search', debouncedQuery],
        queryFn: () => workspaceService.search(debouncedQuery),
        enabled: debouncedQuery.length >= 2,
    });

    const results = data?.results;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Suche</DialogTitle>
                </DialogHeader>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tasks und Notizen durchsuchen..."
                        className="pl-9"
                        autoFocus
                    />
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                    {query.length < 2 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Mindestens 2 Zeichen eingeben
                        </p>
                    )}

                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    )}

                    {results && (
                        <>
                            {/* Tasks */}
                            {results.tasks.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                        <ListTodo className="h-4 w-4" />
                                        Tasks ({results.tasks.length})
                                    </h4>
                                    <div className="space-y-1">
                                        {results.tasks.map((task: Task) => (
                                            <div
                                                key={task.id}
                                                className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                                />
                                                <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                                                    {task.title}
                                                </span>
                                                {task.category && (
                                                    <span
                                                        className="text-xs px-1.5 py-0.5 rounded"
                                                        style={{
                                                            backgroundColor: `${task.category.color}20`,
                                                            color: task.category.color || undefined,
                                                        }}
                                                    >
                                                        {task.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {results.notes.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4" />
                                        Notizen ({results.notes.length})
                                    </h4>
                                    <div className="space-y-1">
                                        {results.notes.map((note: AdminNote) => (
                                            <div
                                                key={note.id}
                                                className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: getAdminColor(note.ownerId) }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{note.title}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {note.content.substring(0, 100)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.tasks.length === 0 && results.notes.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Keine Ergebnisse gefunden
                                </p>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Schliessen
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
