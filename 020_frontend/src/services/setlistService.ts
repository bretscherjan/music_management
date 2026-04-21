import api from '@/lib/api';

export interface SetlistItem {
    id: number;
    setlistId: number;
    sheetMusicId: number | null;
    position: number;
    title: string | null;
    notes: string | null;
    duration: number | null;
    type: 'sheetMusic' | 'pause' | 'custom';
    sheetMusic?: {
        id: number;
        title: string;
        composer: string | null;
        genre?: string | null;
    } | null;
}

export interface Setlist {
    id: number;
    name: string;
    description: string | null;
    eventId: number | null;
    createdAt: string;
    updatedAt: string;
    event?: { id: number; title: string; date: string } | null;
    items: SetlistItem[];
}

export interface CreateSetlistDto {
    name: string;
    description?: string;
    eventId?: number | null;
}

export interface AddSetlistItemDto {
    sheetMusicId?: number | null;
    title?: string;
    notes?: string;
    duration?: number;
    type?: 'sheetMusic' | 'pause' | 'custom';
}

export const setlistService = {
    async getAll(): Promise<Setlist[]> {
        const response = await api.get<Setlist[]>('/setlists');
        return response.data;
    },

    async getById(id: number): Promise<Setlist> {
        const response = await api.get<Setlist>(`/setlists/${id}`);
        return response.data;
    },

    async create(data: CreateSetlistDto): Promise<Setlist> {
        const response = await api.post<Setlist>('/setlists', data);
        return response.data;
    },

    async update(id: number, data: Partial<CreateSetlistDto>): Promise<Setlist> {
        const response = await api.put<Setlist>(`/setlists/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/setlists/${id}`);
    },

    async addItem(setlistId: number, data: AddSetlistItemDto): Promise<SetlistItem> {
        const response = await api.post<SetlistItem>(`/setlists/${setlistId}/items`, data);
        return response.data;
    },

    async removeItem(setlistId: number, itemId: number): Promise<void> {
        await api.delete(`/setlists/${setlistId}/items/${itemId}`);
    },

    async reorderItems(setlistId: number, items: { id: number; position: number }[]): Promise<Setlist> {
        const response = await api.put<Setlist>(`/setlists/${setlistId}/items/reorder`, { items });
        return response.data;
    },
};
