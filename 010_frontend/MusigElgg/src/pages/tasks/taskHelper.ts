import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../helpers/apiService';
import { AssignedTaskStatus } from '../../api/generated/ApiClient';
import type {
    AssignedTaskResponseDto,
    CreateAssignedTaskRequestDto,
    UpdateAssignedTaskRequestDto
} from '../../api/generated/ApiClient';

// ============================================================================
// Query Keys
// ============================================================================
export const taskKeys = {
    all: ['tasks'] as const,
    list: (filters?: TaskFilters) => [...taskKeys.all, 'list', filters ?? {}] as const,
    detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
    comments: (id: string) => [...taskKeys.all, 'comments', id] as const,
};

// ============================================================================
// Types
// ============================================================================
export interface TaskFilters {
    assignedToMe?: boolean;
    status?: AssignedTaskStatus;
    overdue?: boolean;
    includeArchived?: boolean;
}

export interface TaskComment {
    id: string;
    content: string;
    authorName: string;
    createdAt: Date;
}

export interface ChecklistItem {
    id: string;
    text: string;
    isChecked: boolean;
}

// Extended task type with computed properties
export interface EnhancedTask extends AssignedTaskResponseDto {
    comments?: TaskComment[];
    checklist?: ChecklistItem[];
    progress?: number; // 0-100 based on checklist completion
}

// ============================================================================
// Status Helpers
// ============================================================================
export const STATUS_CONFIG = {
    [AssignedTaskStatus.Open]: {
        label: 'Offen',
        color: 'bg-neutral-100',
        textColor: 'text-neutral-700',
        icon: '📋',
    },
    [AssignedTaskStatus.InProgress]: {
        label: 'In Arbeit',
        color: 'bg-amber-50',
        textColor: 'text-amber-800',
        icon: '🔧',
    },
    [AssignedTaskStatus.Completed]: {
        label: 'Erledigt',
        color: 'bg-green-50',
        textColor: 'text-green-800',
        icon: '✅',
    },
    [AssignedTaskStatus.Archived]: {
        label: 'Archiviert',
        color: 'bg-gray-100',
        textColor: 'text-gray-500',
        icon: '📦',
    },
    [AssignedTaskStatus.Cancelled]: {
        label: 'Abgebrochen',
        color: 'bg-red-50',
        textColor: 'text-red-800',
        icon: '❌',
    },
};

export const PRIORITY_CONFIG: Record<number, { label: string; color: string; bgColor: string }> = {
    1: { label: 'Niedrig', color: 'text-gray-500', bgColor: 'bg-gray-100' },
    2: { label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    3: { label: 'Hoch', color: 'text-secondary-600', bgColor: 'bg-secondary-50' },
    4: { label: 'Dringend', color: 'text-primary-700', bgColor: 'bg-primary-50' },
};

export const getPriorityConfig = (priority?: number) => {
    return PRIORITY_CONFIG[priority ?? 2] || PRIORITY_CONFIG[2];
};

export const getStatusConfig = (status?: AssignedTaskStatus) => {
    return STATUS_CONFIG[status ?? AssignedTaskStatus.Open] || STATUS_CONFIG[AssignedTaskStatus.Open];
};

// ============================================================================
// Hooks
// ============================================================================
export const useTasks = (filters: TaskFilters = {}) => {
    return useQuery({
        queryKey: taskKeys.list(filters),
        queryFn: async () => {
            return apiService.tasksAll();
        },
        select: (data: AssignedTaskResponseDto[]) => {
            let filtered = data;
            if (filters.overdue) {
                filtered = filtered.filter(
                    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== AssignedTaskStatus.Completed
                );
            }
            if (filters.status !== undefined) {
                filtered = filtered.filter((t) => t.status === filters.status);
            }
            return filtered;
        },
    });
};

export const useTask = (id: string) => {
    return useQuery({
        queryKey: taskKeys.detail(id),
        queryFn: () => apiService.tasksGET(id),
        enabled: !!id,
    });
};

export const useTaskComments = (taskId: string) => {
    return useQuery({
        queryKey: taskKeys.comments(taskId),
        queryFn: async (): Promise<TaskComment[]> => {
            // Manual fetch - endpoint not in generated client
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141';
            const response = await fetch(`${baseUrl}/api/Tasks/${taskId}/comments`);
            if (!response.ok) {
                console.warn('Comments endpoint not available');
                return [];
            }
            return response.json();
        },
        enabled: !!taskId,
    });
};

// ============================================================================
// Mutations
// ============================================================================
export const useTaskMutations = () => {
    const queryClient = useQueryClient();

    const moveTask = useMutation({
        mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: AssignedTaskStatus }) => {
            const dto: UpdateAssignedTaskRequestDto = { status: newStatus };
            return apiService.tasksPUT(taskId, dto);
        },
        onMutate: async ({ taskId, newStatus }) => {
            await queryClient.cancelQueries({ queryKey: taskKeys.all });
            const previousTasks = queryClient.getQueryData<AssignedTaskResponseDto[]>(taskKeys.list({}));

            queryClient.setQueriesData(
                { queryKey: taskKeys.list({}) },
                (old: AssignedTaskResponseDto[] | undefined) => {
                    if (!old) return [];
                    return old.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
                }
            );
            return { previousTasks };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousTasks) {
                queryClient.setQueriesData({ queryKey: taskKeys.list({}) }, context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
        },
    });

    const createTask = useMutation({
        mutationFn: (data: CreateAssignedTaskRequestDto) => apiService.tasksPOST(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
        },
    });

    const updateTask = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAssignedTaskRequestDto }) =>
            apiService.tasksPUT(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
        },
    });

    const deleteTask = useMutation({
        mutationFn: (id: string) => apiService.tasksDELETE(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
        },
    });

    const addComment = useMutation({
        mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141';
            const response = await fetch(`${baseUrl}/api/Tasks/${taskId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            if (!response.ok) throw new Error('Failed to add comment');
            return response.json();
        },
        onSuccess: (_, { taskId }) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.comments(taskId) });
        },
    });

    return { moveTask, createTask, updateTask, deleteTask, addComment };
};

// ============================================================================
// Helper Hook for TaskBoardPage (combines everything)
// ============================================================================
export const useTasksHelper = () => {
    const { data: tasks = [], isLoading: loading, error } = useTasks({});
    const { moveTask } = useTaskMutations();

    const updateStatus = (taskId: string, newStatus: AssignedTaskStatus) => {
        moveTask.mutate({ taskId, newStatus });
    };

    const getTasksByStatus = (status: AssignedTaskStatus) => {
        return tasks.filter((t) => t.status === status);
    };

    return {
        tasks,
        loading,
        error,
        updateStatus,
        getTasksByStatus,
        isUpdating: moveTask.isPending,
    };
};

// ============================================================================
// Utility Functions
// ============================================================================
export const formatDueDate = (date?: Date | string): string => {
    if (!date) return '-';
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return `${Math.abs(days)} Tage überfällig`;
    if (days === 0) return 'Heute';
    if (days === 1) return 'Morgen';
    if (days <= 7) return `In ${days} Tagen`;
    return d.toLocaleDateString('de-CH');
};

export const isOverdue = (task: AssignedTaskResponseDto): boolean => {
    if (!task.dueDate || task.status === AssignedTaskStatus.Completed) return false;
    return new Date(task.dueDate) < new Date();
};
