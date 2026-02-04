import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    Edit,
    MoreHorizontal,
    Trash,
    Archive,
    ArchiveRestore,
    History,
    Link,
} from 'lucide-react';

import workspaceService from '@/services/workspaceService';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import type { Task, TaskHistory as TaskHistoryType } from '@/types/workspace';
import { getAdminColor, getPriorityColor, getPriorityLabel, getActionLabel } from '@/types/workspace';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TaskListProps {
    tasks: Task[];
    isLoading: boolean;
    onEdit: (task: Task) => void;
    onRefresh: () => void;
}

export function TaskList({ tasks, isLoading, onEdit, onRefresh }: TaskListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Keine Tasks vorhanden. Erstelle einen neuen Task!
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {tasks.map((task) => (
                <TaskItem
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onRefresh={onRefresh}
                />
            ))}
        </div>
    );
}

interface TaskItemProps {
    task: Task;
    onEdit: (task: Task) => void;
    onRefresh: () => void;
    depth?: number;
}

function TaskItem({ task, onEdit, onRefresh, depth = 0 }: TaskItemProps) {
    const queryClient = useQueryClient();
    const [showSubtasks, setShowSubtasks] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<TaskHistoryType[]>([]);

    // Complete mutation
    const completeMutation = useMutation({
        mutationFn: () => workspaceService.completeTask(task.id, !task.completed),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            toast.success(task.completed ? 'Task wieder geöffnet' : 'Task erledigt');
        },
        onError: () => toast.error('Fehler beim Aktualisieren'),
    });

    // Archive mutation
    const archiveMutation = useMutation({
        mutationFn: () => workspaceService.archiveTask(task.id, !task.archived),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            toast.success(task.archived ? 'Task wiederhergestellt' : 'Task archiviert');
        },
        onError: () => toast.error('Fehler beim Archivieren'),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => workspaceService.deleteTask(task.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
            toast.success('Task gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen'),
    });

    // Load history
    const loadHistory = async () => {
        try {
            const data = await workspaceService.getTaskHistory(task.id);
            setHistory(data.history);
            setShowHistory(true);
        } catch {
            toast.error('Fehler beim Laden des Verlaufs');
        }
    };

    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    return (
        <>
            <div
                className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${task.completed ? 'opacity-60' : ''
                    } ${task.archived ? 'border-dashed' : ''}`}
                style={{ marginLeft: depth * 24 }}
            >
                {/* Expand/Collapse for subtasks */}
                <div className="w-5 flex-shrink-0">
                    {hasSubtasks && (
                        <button
                            onClick={() => setShowSubtasks(!showSubtasks)}
                            className="p-0.5 hover:bg-muted rounded"
                        >
                            {showSubtasks ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>

                {/* Checkbox */}
                <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="mt-0.5"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                        {/* Title */}
                        <span
                            className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                            {task.title}
                        </span>

                        {/* Priority Badge */}
                        <span
                            className="px-1.5 py-0.5 text-xs rounded"
                            style={{
                                backgroundColor: `${getPriorityColor(task.priority)}20`,
                                color: getPriorityColor(task.priority),
                            }}
                        >
                            {getPriorityLabel(task.priority)}
                        </span>

                        {/* Event Link */}
                        {task.event && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Link className="h-3 w-3" />
                                {task.event.title}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {/* Created by */}
                        {task.createdBy && (
                            <span className="flex items-center gap-1">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getAdminColor(task.createdBy.id) }}
                                />
                                {task.createdBy.firstName}
                            </span>
                        )}

                        {/* Completed by */}
                        {task.completedBy && (
                            <span className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getAdminColor(task.completedBy.id) }}
                                />
                                {task.completedBy.firstName}
                            </span>
                        )}

                        {/* Due date */}
                        {task.dueDate && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.dueDate), 'dd.MM.yyyy', { locale: de })}
                            </span>
                        )}

                        {/* Subtask count */}
                        {hasSubtasks && (
                            <span>
                                {task.subtasks!.filter((s) => s.completed).length}/{task.subtasks!.length} Subtasks
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={loadHistory}>
                            <History className="h-4 w-4 mr-2" />
                            Verlauf
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => archiveMutation.mutate()}>
                            {task.archived ? (
                                <>
                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                    Wiederherstellen
                                </>
                            ) : (
                                <>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archivieren
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => deleteMutation.mutate()}
                            className="text-destructive"
                        >
                            <Trash className="h-4 w-4 mr-2" />
                            Löschen
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Subtasks */}
            {showSubtasks && hasSubtasks && (
                <div className="ml-6 pl-4 border-l-2 border-border">
                    {task.subtasks!.map((subtask) => (
                        <TaskItem
                            key={subtask.id}
                            task={subtask}
                            onEdit={onEdit}
                            onRefresh={onRefresh}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}

            {/* History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Task-Verlauf: {task.title}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {history.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center gap-3 p-2 rounded bg-muted/50"
                            >
                                <span
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getAdminColor(entry.user.id) }}
                                />
                                <div className="flex-1">
                                    <span className="font-medium">
                                        {entry.user.firstName} {entry.user.lastName}
                                    </span>
                                    <span className="text-muted-foreground"> hat </span>
                                    <span className="font-medium">{getActionLabel(entry.action)}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(entry.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                                </span>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
