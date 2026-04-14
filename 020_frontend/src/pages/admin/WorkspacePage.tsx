import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import {
    Plus,
    Search,
    Download,
    RefreshCw,
    Wifi,
    WifiOff,
    ListTodo,
    FileText,
    Settings,
    Mic,
} from 'lucide-react';
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
} from '@dnd-kit/sortable';

import { authService } from '@/services/authService';
import workspaceService from '@/services/workspaceService';
import socketService from '@/services/socketService';
import userService from '@/services/userService';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    TooltipProvider,
} from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { CategoryManager } from '@/components/workspace/CategoryManager';
import { DraggableTaskItem } from '@/components/workspace/DraggableTaskItem';
import { NoteCard } from '@/components/workspace/NoteCard';
import { MentionInput, renderMentionsText } from '@/components/workspace/MentionInput';
import { FormattedInput } from '@/components/workspace/FormattedInput';
import { MarkdownEditor, renderMarkdownPreview } from '@/components/workspace/MarkdownEditor';
import { MeetingRecorderDialog } from '@/components/workspace/MeetingRecorderDialog';

import type { Task, AdminNote, TaskPriority } from '@/types/workspace';
import { PdfExportDialog } from '@/components/ui/PdfExportDialog';
import type { PdfOptions } from '@/utils/pdfTheme';

type TabType = 'tasks' | 'notes';

export function WorkspacePage() {
    const queryClient = useQueryClient();
    const token = authService.getToken();

    const [activeTab, setActiveTab] = useState<TabType>('tasks');
    const [isConnected, setIsConnected] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showRecorder, setShowRecorder] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch] = useDebounce(searchQuery, 300);

    // DnD Sensors
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

    // Inline form states
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');


    // Connect to WebSocket on mount
    // Connect to WebSocket on mount
    const socketConnectedRef = useRef(false);

    useEffect(() => {
        if (token && !socketConnectedRef.current) {
            socketConnectedRef.current = true;
            socketService
                .connect(token)
                .then(() => setIsConnected(true))
                .catch((err) => {
                    console.error('Failed to connect:', err);
                    setIsConnected(false);
                    socketConnectedRef.current = false;
                });
        }

        return () => {
            // Only disconnect on unmount, not on every render if dependencies change harmlessly
            // But here strict mode might double invoke.
            // Leaving disconnect logic but adding guard above helps.
            if (socketConnectedRef.current) {
                socketService.disconnect();
                socketConnectedRef.current = false;
                setIsConnected(false);
            }
        };
    }, [token]);

    // Set up real-time event listeners
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribers: (() => void)[] = [];

        unsubscribers.push(
            socketService.on('task:created', () => {
                queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            })
        );
        unsubscribers.push(
            socketService.on('task:updated', () => {
                queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            })
        );
        unsubscribers.push(
            socketService.on('tasks:reordered', () => {
                queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            })
        );
        unsubscribers.push(
            socketService.on('note:created', () => {
                queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
            })
        );
        unsubscribers.push(
            socketService.on('note:updated', () => {
                queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
            })
        );

        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [isConnected, queryClient]);

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['workspace', 'categories'],
        queryFn: () => workspaceService.getCategories(),
    });

    // Fetch tasks
    const { data: tasksData, isLoading: tasksLoading } = useQuery({
        queryKey: ['workspace', 'tasks', selectedCategoryId],
        queryFn: () =>
            workspaceService.getTasks({
                categoryId: selectedCategoryId || undefined,
                includeCompleted: true,
            }),
    });

    // Fetch notes
    const { data: notesData, isLoading: notesLoading } = useQuery({
        queryKey: ['workspace', 'notes'],
        queryFn: () => workspaceService.getNotes(),
        enabled: activeTab === 'notes',
    });

    // Fetch users (for mentions)
    const { data: usersData } = useQuery({
        queryKey: ['users', 'all'],
        queryFn: () => userService.getAll(),
    });

    // Search query
    const { data: searchResults } = useQuery({
        queryKey: ['workspace', 'search', debouncedSearch],
        queryFn: () => workspaceService.search(debouncedSearch),
        enabled: showSearch && debouncedSearch.length >= 2,
    });

    const categories = categoriesData?.categories || [];
    const tasks = tasksData?.tasks || [];
    const notes = notesData?.notes || [];
    const users = usersData || [];

    // Create Task Mutation
    const createTaskMutation = useMutation({
        mutationFn: (title: string) =>
            workspaceService.createTask({
                title,
                ...(selectedCategoryId && { categoryId: selectedCategoryId }),
                priority: newTaskPriority, // Use state priority
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            queryClient.invalidateQueries({ queryKey: ['workspace', 'categories'] });
            setNewTaskTitle('');
            toast.success('Task erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen'),
    });

    // Update Task Mutation
    const updateTaskMutation = useMutation({
        mutationFn: ({ id, title }: { id: number; title: string }) =>
            workspaceService.updateTask(id, { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
        },
    });

    // Complete Task Mutation
    const completeTaskMutation = useMutation({
        mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
            workspaceService.completeTask(id, completed),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
        },
    });

    // Delete Task Mutation
    const deleteTaskMutation = useMutation({
        mutationFn: (id: number) => workspaceService.deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            toast.success('Task gelöscht');
        },
    });

    const reorderTasksMutation = useMutation({
        mutationFn: (tasks: { id: number; position: number }[]) =>
            workspaceService.reorderTasks(tasks),
        onError: () => {
            toast.error('Fehler beim Sortieren');
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
        },
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Logic for optimistically updating the cache
            const oldIndex = tasks.findIndex((t) => t.id === active.id);
            const newIndex = tasks.findIndex((t) => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newTasks = arrayMove(tasks, oldIndex, newIndex);

                // Optimistic update
                queryClient.setQueryData(['workspace', 'tasks', selectedCategoryId], { tasks: newTasks });

                const payload = newTasks.map((t, i) => ({
                    id: t.id,
                    position: i,
                }));
                reorderTasksMutation.mutate(payload);
            }
        }
    };

    // Create Note Mutation
    const createNoteMutation = useMutation({
        mutationFn: ({ title, content }: { title: string; content: string }) =>
            workspaceService.createNote({ title, content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
            setNewNoteTitle('');
            setNewNoteContent('');
            toast.success('Notiz erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen'),
    });

    // Update Note Mutation
    const updateNoteMutation = useMutation({
        mutationFn: ({ id, title, content }: { id: number; title?: string; content?: string }) =>
            workspaceService.updateNote(id, { title, content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
        },
    });

    // Pin Note Mutation
    const pinNoteMutation = useMutation({
        mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) =>
            workspaceService.pinNote(id, pinned),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
        },
    });

    // Delete Note Mutation
    const deleteNoteMutation = useMutation({
        mutationFn: (id: number) => workspaceService.deleteNote(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'notes'] });
            toast.success('Notiz gelöscht');
        },
    });

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        createTaskMutation.mutate(newTaskTitle.trim());
    };

    const handleAddNote = () => {
        if (!newNoteTitle.trim()) return;
        createNoteMutation.mutate({
            title: newNoteTitle.trim(),
            content: newNoteContent,
        });
    };

    const handleExportPdf = async (opts: PdfOptions) => {
        try {
            const { generatePdf } = await import('@/utils/pdfGenerator');
            generatePdf({
                tasks: tasks || [],
                notes: notes || [],
                history: []
            }, opts);
            toast.success('PDF Export gestartet');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Fehler beim PDF Export');
        }
    };

    return (
        <TooltipProvider>
            <div className="container-app py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[hsl(var(--musig-dark))]">
                            Admin Workspace
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tasks und Notizen für Admins
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Connection status */}
                        <div
                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${isConnected
                                ? 'bg-success/10 text-success'
                                : 'bg-red-100 text-red-700'
                                }`}
                        >
                            {isConnected ? (
                                <Wifi className="h-3 w-3" />
                            ) : (
                                <WifiOff className="h-3 w-3" />
                            )}
                            {isConnected ? 'Live' : 'Offline'}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowSearch(true)}
                            title="Suche"
                        >
                            <Search className="h-4 w-4" />
                        </Button>

                        <PdfExportDialog
                            trigger={
                                <Button variant="outline" size="icon" title="PDF Export">
                                    <Download className="h-4 w-4" />
                                </Button>
                            }
                            title="Workspace exportieren"
                            onExport={handleExportPdf}
                        />

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                queryClient.invalidateQueries({ queryKey: ['workspace'] });
                            }}
                            title="Aktualisieren"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="segmented-control flex-1 max-w-xs">
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={cn('segmented-control-option flex items-center gap-1.5', activeTab === 'tasks' && 'is-active')}
                        >
                            <ListTodo className="h-3.5 w-3.5" />
                            Tasks
                            {tasks.filter((t: Task) => !t.completed).length > 0 && (
                                <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-primary/15 text-primary rounded-full leading-none">
                                    {tasks.filter((t: Task) => !t.completed).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={cn('segmented-control-option flex items-center gap-1.5', activeTab === 'notes' && 'is-active')}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Notizen
                            {notes.length > 0 && (
                                <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-primary/15 text-primary rounded-full leading-none">
                                    {notes.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Recording button – visible only when on notes tab */}
                    {activeTab === 'notes' && (
                        <Button
                            variant="outline"
                            onClick={() => setShowRecorder(true)}
                            className="gap-2 ml-auto"
                            title="Sitzung aufnehmen & transkribieren"
                        >
                            <Mic className="h-4 w-4 text-red-500" />
                            Aufnehmen
                        </Button>
                    )}
                </div>

                {/* TASKS TAB */}
                {activeTab === 'tasks' && (
                    <div className="space-y-4">
                        {/* Category Tabs */}
                        <div className="flex items-center gap-2 pb-2">
                            <div className="flex-1 overflow-x-auto">
                                <Tabs
                                    value={selectedCategoryId ? String(selectedCategoryId) : 'all'}
                                    onValueChange={(val) => setSelectedCategoryId(val === 'all' ? null : Number(val))}
                                >
                                    <TabsList className="mb-0">
                                        <TabsTrigger value="all" className="data-[state=active]:bg-muted">
                                            Alle Tasks
                                        </TabsTrigger>
                                        {categories.map((cat) => (
                                            <TabsTrigger
                                                key={cat.id}
                                                value={String(cat.id)}
                                                className="data-[state=active]:bg-muted flex items-center gap-2"
                                                style={{ borderLeft: `3px solid ${cat.color || 'transparent'}` }}
                                            >
                                                {cat.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowCategoryManager(true)}
                                title="Kategorien verwalten"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Inline Add Task */}
                        <div className="flex gap-2 items-start">
                            <div className="flex-1">
                                <FormattedInput
                                    value={newTaskTitle}
                                    onChange={setNewTaskTitle}
                                    users={users}
                                    placeholder="Neuen Task hinzufügen... (verwende @Name)"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddTask();
                                    }}
                                />
                            </div>

                            <Select
                                value={newTaskPriority}
                                onValueChange={(v) => setNewTaskPriority(v as TaskPriority)}
                            >
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue placeholder="Priorität" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Niedrig</SelectItem>
                                    <SelectItem value="medium">Mittel</SelectItem>
                                    <SelectItem value="high">Hoch</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={handleAddTask}
                                disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Hinzufügen
                            </Button>
                        </div>

                        {/* Task List */}
                        {tasksLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ListTodo className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-base">Keine Tasks vorhanden</p>
                                    <p className="text-sm text-muted-foreground mt-1">Erstelle oben deinen ersten Task!</p>
                                </div>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={tasks.map((t) => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2">
                                        {tasks.map((task: Task) => (
                                            <DraggableTaskItem
                                                key={task.id}
                                                task={task}
                                                users={users}
                                                onComplete={(id, val) =>
                                                    completeTaskMutation.mutate({ id, completed: val })
                                                }
                                                onDelete={(id) => deleteTaskMutation.mutate(id)}
                                                onUpdateTitle={(id, title) =>
                                                    updateTaskMutation.mutate({ id, title })
                                                }
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                )}


                {/* NOTES TAB */}
                {
                    activeTab === 'notes' && (
                        <div className="space-y-4">
                            {/* Inline Add Note */}
                            <div className="native-group p-4 space-y-3">
                                <FormattedInput
                                    value={newNoteTitle}
                                    onChange={setNewNoteTitle}
                                    users={users}
                                    placeholder="Notiz-Titel... (@Name)"
                                />

                                <MarkdownEditor
                                    value={newNoteContent}
                                    onChange={setNewNoteContent}
                                    users={users}
                                    placeholder="Notiz-Inhalt... (Markdown + @Name)"
                                    minHeight="120px"
                                />

                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleAddNote}
                                        disabled={!newNoteTitle.trim() || createNoteMutation.isPending}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Notiz erstellen
                                    </Button>
                                </div>
                            </div>

                            {/* Notes List */}
                            {notesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                                </div>
                            ) : notes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-base">Keine Notizen vorhanden</p>
                                        <p className="text-sm text-muted-foreground mt-1">Erstelle oben eine neue Notiz!</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {notes.map((note: AdminNote) => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            users={users}
                                            onUpdate={(id, title, content) =>
                                                updateNoteMutation.mutate({ id, title, content })
                                            }
                                            onDelete={(id) => deleteNoteMutation.mutate(id)}
                                            onPin={(id, pinned) => pinNoteMutation.mutate({ id, pinned })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Category Manager Dialog */}
                {
                    showCategoryManager && (
                        <CategoryManager
                            open={showCategoryManager}
                            onClose={() => setShowCategoryManager(false)}
                            categories={categories}
                        />
                    )
                }

                {/* Meeting Recorder Dialog */}
                <MeetingRecorderDialog
                    open={showRecorder}
                    onClose={() => setShowRecorder(false)}
                    onSave={(title, content) => {
                        createNoteMutation.mutate({ title, content });
                        setActiveTab('notes');
                    }}
                />

                {/* Search Dialog */}
                <Dialog open={showSearch} onOpenChange={setShowSearch}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Suche</DialogTitle>
                            <DialogDescription>
                                Suche nach Tasks, Notizen und mehr.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <MentionInput
                                placeholder="Suche nach Tasks oder Notizen... (@Name)"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                users={users}
                                className="w-full"
                            />
                            {searchResults?.results && (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {searchResults.results.tasks.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <ListTodo className="h-4 w-4" />
                                                Tasks ({searchResults.results.tasks.length})
                                            </h4>
                                            <div className="space-y-1">
                                                {searchResults.results.tasks.map((task: Task) => (
                                                    <div
                                                        key={task.id}
                                                        className="p-3 rounded-xl border hover:bg-muted/50 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setShowSearch(false);
                                                            setActiveTab('tasks');
                                                        }}
                                                    >
                                                        <span className={task.completed ? 'line-through' : ''}>
                                                            {renderMentionsText(task.title)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {searchResults.results.notes.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Notizen ({searchResults.results.notes.length})
                                            </h4>
                                            <div className="space-y-1">
                                                {searchResults.results.notes.map((note: AdminNote) => (
                                                    <div
                                                        key={note.id}
                                                        className="p-3 rounded-xl border hover:bg-muted/50 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setShowSearch(false);
                                                            setActiveTab('notes');
                                                        }}
                                                    >
                                                        <div className="font-medium">{renderMentionsText(note.title)}</div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {renderMarkdownPreview(note.content)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div >
        </TooltipProvider >
    );
}
