import api from '../lib/api';
import type {
    TaskCategory,
    CreateCategoryDto,
    UpdateCategoryDto,
    Task,
    CreateTaskDto,
    UpdateTaskDto,
    ReorderTaskDto,
    TaskHistory,
    AdminNote,
    CreateNoteDto,
    UpdateNoteDto,
    SearchResult,
    WorkspaceStats,
} from '@/types/workspace';

const workspaceService = {
    // ============================================
    // CATEGORIES
    // ============================================

    async getCategories(): Promise<{ categories: TaskCategory[] }> {
        const response = await api.get<{ categories: TaskCategory[] }>('/workspace/categories');
        return response.data;
    },

    async createCategory(data: CreateCategoryDto): Promise<{ message: string; category: TaskCategory }> {
        const response = await api.post<{ message: string; category: TaskCategory }>('/workspace/categories', data);
        return response.data;
    },

    async updateCategory(id: number, data: UpdateCategoryDto): Promise<{ message: string; category: TaskCategory }> {
        const response = await api.put<{ message: string; category: TaskCategory }>(`/workspace/categories/${id}`, data);
        return response.data;
    },

    async deleteCategory(id: number): Promise<{ message: string }> {
        const response = await api.delete<{ message: string }>(`/workspace/categories/${id}`);
        return response.data;
    },

    async reorderCategories(categories: { id: number; position: number }[]): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>('/workspace/categories/reorder', { categories });
        return response.data;
    },

    // ============================================
    // TASKS
    // ============================================

    async getTasks(params?: {
        categoryId?: number;
        includeArchived?: boolean;
        includeCompleted?: boolean;
        parentId?: number | 'null';
    }): Promise<{ tasks: Task[] }> {
        const response = await api.get<{ tasks: Task[] }>('/workspace/tasks', { params });
        return response.data;
    },

    async createTask(data: CreateTaskDto): Promise<{ message: string; task: Task }> {
        const response = await api.post<{ message: string; task: Task }>('/workspace/tasks', data);
        return response.data;
    },

    async updateTask(id: number, data: UpdateTaskDto): Promise<{ message: string; task: Task }> {
        const response = await api.put<{ message: string; task: Task }>(`/workspace/tasks/${id}`, data);
        return response.data;
    },

    async completeTask(id: number, completed: boolean): Promise<{ message: string; task: Task }> {
        const response = await api.put<{ message: string; task: Task }>(`/workspace/tasks/${id}/complete`, { completed });
        return response.data;
    },

    async archiveTask(id: number, archived: boolean): Promise<{ message: string; task: Task }> {
        const response = await api.put<{ message: string; task: Task }>(`/workspace/tasks/${id}/archive`, { archived });
        return response.data;
    },

    async deleteTask(id: number): Promise<{ message: string }> {
        const response = await api.delete<{ message: string }>(`/workspace/tasks/${id}`);
        return response.data;
    },

    async reorderTasks(tasks: ReorderTaskDto[]): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>('/workspace/tasks/reorder', { tasks });
        return response.data;
    },

    async getTaskHistory(id: number): Promise<{ history: TaskHistory[] }> {
        const response = await api.get<{ history: TaskHistory[] }>(`/workspace/tasks/${id}/history`);
        return response.data;
    },

    // ============================================
    // NOTES
    // ============================================

    async getNotes(): Promise<{ notes: AdminNote[] }> {
        const response = await api.get<{ notes: AdminNote[] }>('/workspace/notes');
        return response.data;
    },

    async createNote(data: CreateNoteDto): Promise<{ message: string; note: AdminNote }> {
        const response = await api.post<{ message: string; note: AdminNote }>('/workspace/notes', data);
        return response.data;
    },

    async updateNote(id: number, data: UpdateNoteDto): Promise<{ message: string; note: AdminNote }> {
        const response = await api.put<{ message: string; note: AdminNote }>(`/workspace/notes/${id}`, data);
        return response.data;
    },

    async deleteNote(id: number): Promise<{ message: string }> {
        const response = await api.delete<{ message: string }>(`/workspace/notes/${id}`);
        return response.data;
    },

    async pinNote(id: number, pinned: boolean): Promise<{ message: string; note: AdminNote }> {
        const response = await api.put<{ message: string; note: AdminNote }>(`/workspace/notes/${id}/pin`, { pinned });
        return response.data;
    },

    // ============================================
    // SEARCH & STATS
    // ============================================

    async search(q: string, type: 'tasks' | 'notes' | 'all' = 'all'): Promise<{ results: SearchResult }> {
        const response = await api.get<{ results: SearchResult }>('/workspace/search', { params: { q, type } });
        return response.data;
    },

    async getStats(): Promise<{ stats: WorkspaceStats }> {
        const response = await api.get<{ stats: WorkspaceStats }>('/workspace/stats');
        return response.data;
    },

    // ============================================
    // EXPORT
    // ============================================

    async exportPdf(params?: {
        type?: 'tasks' | 'notes' | 'history' | 'all';
        categoryId?: number;
        includeArchived?: boolean;
    }): Promise<Blob> {
        const response = await api.get('/workspace/export/pdf', {
            params,
            responseType: 'blob',
        });
        return response.data;
    },
};

export default workspaceService;
