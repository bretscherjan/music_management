// Workspace Types - Admin Tasks & Notes

// ============================================
// ENUMS
// ============================================

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskHistoryAction =
    | 'created'
    | 'completed'
    | 'uncompleted'
    | 'edited'
    | 'archived'
    | 'unarchived'
    | 'deleted';

// ============================================
// USER REFERENCE (for display)
// ============================================

export interface UserReference {
    id: number;
    firstName: string;
    lastName: string;
}

// ============================================
// CATEGORY
// ============================================

export interface TaskCategory {
    id: number;
    name: string;
    color?: string | null;
    position: number;
    createdAt: string;
    updatedAt: string;
    _count?: {
        tasks: number;
    };
}

export interface CreateCategoryDto {
    name: string;
    color?: string;
    position?: number;
}

export interface UpdateCategoryDto {
    name?: string;
    color?: string | null;
    position?: number;
}

// ============================================
// TASK
// ============================================

export interface Task {
    id: number;
    title: string;
    description?: string | null;
    priority: TaskPriority;
    dueDate?: string | null;
    completed: boolean;
    completedAt?: string | null;
    archived: boolean;
    position: number;
    categoryId: number;
    category?: TaskCategory;
    parentId?: number | null;
    parent?: Task;
    subtasks?: Task[];
    eventId?: number | null;
    event?: {
        id: number;
        title: string;
        date: string;
    } | null;
    createdById: number;
    createdBy?: UserReference;
    completedById?: number | null;
    completedBy?: UserReference | null;
    createdAt: string;
    updatedAt: string;
    _count?: {
        subtasks: number;
    };
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string | null;
    categoryId?: number;
    parentId?: number | null;
    eventId?: number | null;
    position?: number;
}

export interface UpdateTaskDto {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    dueDate?: string | null;
    categoryId?: number;
    parentId?: number | null;
    eventId?: number | null;
    position?: number;
}

export interface ReorderTaskDto {
    id: number;
    position: number;
    categoryId?: number;
    parentId?: number | null;
}

// ============================================
// TASK HISTORY
// ============================================

export interface TaskHistory {
    id: number;
    taskId: number;
    task?: Task;
    userId: number;
    user: UserReference;
    action: TaskHistoryAction;
    details?: Record<string, unknown>;
    createdAt: string;
}

// ============================================
// ADMIN NOTE
// ============================================

export interface NoteContribution {
    id: number;
    noteId: number;
    userId: number;
    user: UserReference;
    charCount: number;
    updatedAt: string;
}

export interface AdminNote {
    id: number;
    title: string;
    content: string;
    ownerId: number;
    owner: UserReference;
    pinned: boolean;
    position: number;
    contributions?: NoteContribution[];
    primaryContributorId?: number; // Calculated server-side
    createdAt: string;
    updatedAt: string;
}

export interface CreateNoteDto {
    title: string;
    content?: string;
    pinned?: boolean;
    position?: number;
}

export interface UpdateNoteDto {
    title?: string;
    content?: string;
    pinned?: boolean;
    position?: number;
}

// ============================================
// SEARCH
// ============================================

export interface SearchResult {
    tasks: Task[];
    notes: AdminNote[];
}

// ============================================
// STATISTICS
// ============================================

export interface WorkspaceStats {
    totalTasks: number;
    completedTasks: number;
    archivedTasks: number;
    totalNotes: number;
    tasksByCategory: Array<{
        id: number;
        name: string;
        count: number;
    }>;
    recentActivity: TaskHistory[];
}

// ============================================
// SOCKET EVENTS
// ============================================

export interface SocketUser {
    userId: number;
    firstName: string;
    lastName: string;
}

export interface CursorPosition {
    userId: number;
    firstName: string;
    lastName: string;
    noteId: number;
    position: number; // Cursor position in text
    selection?: {
        start: number;
        end: number;
    };
}

// ============================================
// HELPER: Get Admin Color
// ============================================

export function getAdminColor(userId: number): string {
    const colors = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#14B8A6', // Teal
        '#F97316', // Orange
    ];
    return colors[(userId - 1) % colors.length];
}

export function getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
        case 'high':
            return '#EF4444'; // Red
        case 'medium':
            return '#F59E0B'; // Amber
        case 'low':
            return '#10B981'; // Green
        default:
            return '#6B7280'; // Gray
    }
}

export function getPriorityLabel(priority: TaskPriority): string {
    switch (priority) {
        case 'high':
            return 'Hoch';
        case 'medium':
            return 'Mittel';
        case 'low':
            return 'Niedrig';
        default:
            return priority;
    }
}

export function getActionLabel(action: TaskHistoryAction): string {
    switch (action) {
        case 'created':
            return 'Erstellt';
        case 'completed':
            return 'Erledigt';
        case 'uncompleted':
            return 'Wieder geöffnet';
        case 'edited':
            return 'Bearbeitet';
        case 'archived':
            return 'Archiviert';
        case 'unarchived':
            return 'Wiederhergestellt';
        case 'deleted':
            return 'Gelöscht';
        default:
            return action;
    }
}
