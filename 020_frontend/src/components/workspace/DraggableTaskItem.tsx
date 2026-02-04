import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { FormattedInput } from '@/components/workspace/FormattedInput';
import { renderMentionsText } from '@/components/workspace/MentionInput';
import type { Task } from '@/types/workspace';
import { getAdminColor, getPriorityColor } from '@/types/workspace';

interface User {
    id: number;
    firstName: string;
    lastName: string;
}

interface DraggableTaskItemProps {
    task: Task;
    users: User[];
    onComplete: (id: number, completed: boolean) => void;
    onDelete: (id: number) => void;
    onUpdateTitle: (id: number, title: string) => void;
}

export function DraggableTaskItem({ task, users, onComplete, onDelete, onUpdateTitle }: DraggableTaskItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

    // We don't need manual toolbar refs anymore as FormattedInput handles it

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSave = () => {
        if (editTitle.trim() !== task.title) {
            onUpdateTitle(task.id, editTitle.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditTitle(task.title);
            setIsEditing(false);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${task.completed ? 'opacity-60' : ''
                }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-move text-muted-foreground hover:text-foreground touch-none"
            >
                <GripVertical className="h-4 w-4" />
            </div>

            <Checkbox
                checked={task.completed}
                onCheckedChange={() => onComplete(task.id, !task.completed)}
            />

            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <FormattedInput
                        value={editTitle}
                        onChange={setEditTitle}
                        users={users}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        autoFocus
                    />
                ) : (
                    <span
                        className={`block cursor-pointer hover:text-primary ${task.completed ? 'line-through text-muted-foreground' : ''
                            }`}
                        onClick={() => {
                            setEditTitle(task.title);
                            setIsEditing(true);
                        }}
                    >
                        {renderMentionsText(task.title)}
                    </span>
                )}
            </div>

            {/* Priority dot */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className="w-2 h-2 rounded-full cursor-help shrink-0"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                    />
                </TooltipTrigger>
                <TooltipContent>
                    Priorität: {task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                </TooltipContent>
            </Tooltip>

            {/* Creator dot */}
            {task.createdBy && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            className="w-3 h-3 rounded-full cursor-help shrink-0"
                            style={{ backgroundColor: getAdminColor(task.createdBy.id) }}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        Erstellt von: {task.createdBy.firstName} {task.createdBy.lastName}
                    </TooltipContent>
                </Tooltip>
            )}

            {/* Completer dot */}
            {task.completed && task.completedBy && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="flex items-center gap-0.5 cursor-help shrink-0">
                            <CheckCircle
                                className="w-3 h-3"
                                style={{ color: getAdminColor(task.completedBy.id) }}
                            />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        Erledigt von: {task.completedBy.firstName} {task.completedBy.lastName}
                    </TooltipContent>
                </Tooltip>
            )}

            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive shrink-0"
                onClick={() => onDelete(task.id)}
            >
                <Trash className="h-4 w-4" />
            </Button>
        </div>
    );
}
