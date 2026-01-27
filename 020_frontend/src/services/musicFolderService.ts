
import api from '@/lib/api';
import type { SheetMusic } from '@/types/sheetMusic';

export interface MusicFolder {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    items?: MusicFolderItem[];
    _count?: { items: number };
}

export interface MusicFolderItem {
    id: number;
    folderId: number;
    sheetMusicId: number;
    position: number;
    sheetMusic: SheetMusic;
}

export const musicFolderService = {
    getAll: async () => {
        const response = await api.get<MusicFolder[]>('/music-folders');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get<MusicFolder>(`/music-folders/${id}`);
        return response.data;
    },
    create: async (data: { name: string; description?: string }) => {
        const response = await api.post<MusicFolder>('/music-folders', data);
        return response.data;
    },
    update: async (id: number, data: { name?: string; description?: string }) => {
        const response = await api.put<MusicFolder>(`/music-folders/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        await api.delete(`/music-folders/${id}`);
    },
    setItems: async (id: number, sheetMusicIds: number[]) => {
        const response = await api.post<MusicFolder>(`/music-folders/${id}/items`, { sheetMusicIds });
        return response.data;
    },
    addItems: async (id: number, sheetMusicIds: number[]) => {
        const response = await api.post<MusicFolder>(`/music-folders/${id}/add-items`, { sheetMusicIds });
        return response.data;
    },
    getZipExportUrl: (id: number) => {
        return `${api.defaults.baseURL}/music-folders/${id}/export-zip`;
    },
    getPdfExportUrl: (id: number) => {
        return `${api.defaults.baseURL}/music-folders/${id}/export-pdf`;
    },
    exportPdf: async (id: number) => {
        const response = await api.get(`/music-folders/${id}/export-pdf`, {
            responseType: 'blob'
        });
        return response.data;
    }
};
