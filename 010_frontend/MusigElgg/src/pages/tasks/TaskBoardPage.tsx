import { useState, useCallback } from 'react';
import {
    Plus,
    X,
    Clock,
    User,
    MessageSquare,
    CheckSquare,
    Flag,
    Calendar,
    GripVertical,
    Send
} from 'lucide-react';
import { AssignedTaskStatus } from '../../api/generated/ApiClient';
import type { AssignedTaskResponseDto } from '../../api/generated/ApiClient';
import {
    useTasksHelper,
    useTaskComments,
    useTaskMutations,
    getPriorityConfig,
    getStatusConfig,
    formatDueDate,
    isOverdue
} from './taskHelper';

// ============================================================================
// Types
// ============================================================================
interface DragItem {
    taskId: string;
    sourceStatus: AssignedTaskStatus;
}

// ============================================================================
// Main Component
// ============================================================================
export const TaskBoardPage = () => {
    const { tasks, loading, updateStatus, isUpdating } = useTasksHelper();
    const [selectedTask, setSelectedTask] = useState<AssignedTaskResponseDto | null>(null);
    const [dragItem, setDragItem] = useState<DragItem | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<AssignedTaskStatus | null>(null);

    const getTasksByStatus = useCallback(
        (status: AssignedTaskStatus) => tasks.filter((t) => t.status === status),
        [tasks]
    );

    const handleDragStart = (taskId: string, sourceStatus: AssignedTaskStatus) => {
        setDragItem({ taskId, sourceStatus });
    };

    const handleDragOver = (e: React.DragEvent, status: AssignedTaskStatus) => {
        e.preventDefault();
        setDragOverColumn(status);
    };

    const handleDrop = (targetStatus: AssignedTaskStatus) => {
        if (dragItem && dragItem.sourceStatus !== targetStatus) {
            updateStatus(dragItem.taskId, targetStatus);
        }
        setDragItem(null);
        setDragOverColumn(null);
    };

    const handleDragEnd = () => {
        setDragItem(null);
        setDragOverColumn(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-600">Lade Aufgaben...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary-800">Assign it!</h1>
                    <p className="text-neutral-600 mt-1">Aufgaben-Verwaltung der Musig Elgg</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors shadow-md">
                    <Plus size={18} />
                    <span>Neue Aufgabe</span>
                </button>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[AssignedTaskStatus.Open, AssignedTaskStatus.InProgress, AssignedTaskStatus.Completed].map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tasks={getTasksByStatus(status)}
                        onTaskClick={setSelectedTask}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        isDragOver={dragOverColumn === status}
                        isUpdating={isUpdating}
                    />
                ))}
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </div>
    );
};

// ============================================================================
// Kanban Column
// ============================================================================
interface KanbanColumnProps {
    status: AssignedTaskStatus;
    tasks: AssignedTaskResponseDto[];
    onTaskClick: (task: AssignedTaskResponseDto) => void;
    onDragStart: (taskId: string, status: AssignedTaskStatus) => void;
    onDragOver: (e: React.DragEvent, status: AssignedTaskStatus) => void;
    onDrop: (status: AssignedTaskStatus) => void;
    onDragEnd: () => void;
    isDragOver: boolean;
    isUpdating: boolean;
}

const KanbanColumn = ({
    status,
    tasks,
    onTaskClick,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    isDragOver,
}: KanbanColumnProps) => {
    const config = getStatusConfig(status);

    return (
        <div
            className={`rounded-xl transition-all duration-200 ${config.color} ${isDragOver ? 'ring-2 ring-primary-400 ring-offset-2' : ''
                }`}
            onDragOver={(e) => onDragOver(e, status)}
            onDrop={() => onDrop(status)}
        >
            {/* Column Header */}
            <div className="p-4 border-b border-black/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <h3 className={`font-semibold ${config.textColor}`}>{config.label}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 text-sm font-medium bg-white/60 rounded-full text-neutral-600">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Cards Container */}
            <div className="p-4 space-y-3 min-h-[400px]">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                        <CheckSquare size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">Keine Aufgaben</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onClick={() => onTaskClick(task)}
                            onDragStart={() => onDragStart(task.id!, status)}
                            onDragEnd={onDragEnd}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Task Card
// ============================================================================
interface TaskCardProps {
    task: AssignedTaskResponseDto;
    onClick: () => void;
    onDragStart: () => void;
    onDragEnd: () => void;
}

const TaskCard = ({ task, onClick, onDragStart, onDragEnd }: TaskCardProps) => {
    const priorityConfig = getPriorityConfig(task.priority);
    const overdue = isOverdue(task);

    // Mock checklist for demo - in real app, this would come from the task
    const mockChecklist = [
        { id: '1', text: 'Noten kopieren', isChecked: true },
        { id: '2', text: 'Liste erstellen', isChecked: false },
    ];
    const checklistProgress = mockChecklist.length > 0
        ? Math.round((mockChecklist.filter((c) => c.isChecked).length / mockChecklist.length) * 100)
        : 0;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className="group bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
        >
            {/* Drag Handle */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100">
                <GripVertical size={14} className="text-neutral-300 group-hover:text-neutral-400" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                    <Flag size={10} className="inline mr-1" />
                    {priorityConfig.label}
                </span>
                {overdue && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-600 ml-auto">
                        Überfällig
                    </span>
                )}
            </div>

            {/* Card Content */}
            <div className="p-3">
                <h4 className="font-semibold text-primary-800 mb-1 line-clamp-2">{task.title}</h4>
                {task.description && (
                    <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{task.description}</p>
                )}

                {/* Checklist Preview */}
                {mockChecklist.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                            <CheckSquare size={12} />
                            <span>{checklistProgress}% erledigt</span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-secondary-500 rounded-full transition-all"
                                style={{ width: `${checklistProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-3">
                        {task.dueDate && (
                            <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
                                <Calendar size={12} />
                                {formatDueDate(task.dueDate)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            3
                        </span>
                        {task.assignee && (
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-xs">
                                {task.assignee.fullName?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Task Detail Modal
// ============================================================================
interface TaskModalProps {
    task: AssignedTaskResponseDto;
    onClose: () => void;
}

const TaskModal = ({ task, onClose }: TaskModalProps) => {
    const { data: comments = [] } = useTaskComments(task.id!);
    const { addComment } = useTaskMutations();
    const [newComment, setNewComment] = useState('');
    const priorityConfig = getPriorityConfig(task.priority);
    const statusConfig = getStatusConfig(task.status);

    // Mock checklist for demo
    const [checklist, setChecklist] = useState([
        { id: '1', text: 'Noten kopieren', isChecked: true },
        { id: '2', text: 'Liste erstellen', isChecked: false },
        { id: '3', text: 'Mitglieder informieren', isChecked: false },
    ]);

    const toggleChecklistItem = (id: string) => {
        setChecklist((prev) =>
            prev.map((item) => (item.id === id ? { ...item, isChecked: !item.isChecked } : item))
        );
    };

    const handleSendComment = () => {
        if (!newComment.trim()) return;
        addComment.mutate({ taskId: task.id!, content: newComment });
        setNewComment('');
    };

    // Mock chat history
    const mockComments = [
        { id: '1', content: 'Ich kümmere mich um die Noten.', authorName: 'Hans Muster', createdAt: new Date('2026-01-07T10:30:00') },
        { id: '2', content: 'Super, danke! Bis wann etwa?', authorName: 'Maria Meier', createdAt: new Date('2026-01-07T14:15:00') },
        { id: '3', content: 'Sollte bis Ende Woche fertig sein.', authorName: 'Hans Muster', createdAt: new Date('2026-01-07T14:20:00') },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-neutral-50">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-medium px-2.5 py-1 rounded ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                                <Flag size={12} className="inline mr-1" />
                                {priorityConfig.label}
                            </span>
                            <span className={`text-sm font-medium px-2.5 py-1 rounded ${statusConfig.color} ${statusConfig.textColor}`}>
                                {statusConfig.icon} {statusConfig.label}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-primary-800">{task.title}</h2>
                        {task.description && (
                            <p className="text-neutral-600 mt-2">{task.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        {task.assignee && (
                            <div className="flex items-center gap-2 text-neutral-600">
                                <User size={16} />
                                <span>{task.assignee.fullName}</span>
                            </div>
                        )}
                        {task.dueDate && (
                            <div className="flex items-center gap-2 text-neutral-600">
                                <Clock size={16} />
                                <span>{formatDueDate(task.dueDate)}</span>
                            </div>
                        )}
                    </div>

                    {/* Checklist */}
                    <div>
                        <h3 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
                            <CheckSquare size={18} />
                            Teilaufgaben
                        </h3>
                        <div className="space-y-2">
                            {checklist.map((item) => (
                                <label
                                    key={item.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                >
                                    <button
                                        onClick={() => toggleChecklistItem(item.id)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.isChecked
                                            ? 'bg-secondary-500 border-secondary-500 text-white'
                                            : 'border-neutral-300 hover:border-secondary-400'
                                            }`}
                                    >
                                        {item.isChecked && <CheckSquare size={12} />}
                                    </button>
                                    <span className={item.isChecked ? 'line-through text-neutral-400' : 'text-neutral-700'}>
                                        {item.text}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Chat / Comments */}
                    <div>
                        <h3 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
                            <MessageSquare size={18} />
                            Diskussion
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {(comments.length > 0 ? comments : mockComments).map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm flex-shrink-0">
                                        {comment.authorName.charAt(0)}
                                    </div>
                                    <div className="flex-1 bg-neutral-50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm text-neutral-800">{comment.authorName}</span>
                                            <span className="text-xs text-neutral-400">
                                                {new Date(comment.createdAt).toLocaleString('de-CH')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-600">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Comment Input */}
                <div className="p-4 border-t border-neutral-100 bg-neutral-50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                            placeholder="Nachricht schreiben..."
                            className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleSendComment}
                            disabled={!newComment.trim()}
                            className="px-4 py-2.5 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { TaskBoardPage as TasksPage };
