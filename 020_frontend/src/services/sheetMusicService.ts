import api from '@/lib/api';
import type {
    SheetMusic,
    CreateSheetMusicDto,
    UpdateSheetMusicDto,
    SheetMusicQueryParams,
    SheetMusicPaginationResponse,
    ImportCsvDto,
    ImportCsvResponse,
} from '@/types/sheetMusic';

export const sheetMusicService = {
    async getAll(params?: SheetMusicQueryParams): Promise<SheetMusicPaginationResponse> {
        const response = await api.get<SheetMusicPaginationResponse>('/sheet-music', { params });
        return response.data;
    },

    async getById(id: number): Promise<SheetMusic> {
        const response = await api.get<{ sheetMusic: SheetMusic }>(`/sheet-music/${id}`);
        return response.data.sheetMusic;
    },

    async create(data: CreateSheetMusicDto): Promise<SheetMusic> {
        const response = await api.post<{ sheetMusic: SheetMusic }>('/sheet-music', data);
        return response.data.sheetMusic;
    },

    async update(id: number, data: UpdateSheetMusicDto): Promise<SheetMusic> {
        const response = await api.put<{ sheetMusic: SheetMusic }>(`/sheet-music/${id}`, data);
        return response.data.sheetMusic;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/sheet-music/${id}`);
    },

    async importCsv(dto: ImportCsvDto): Promise<ImportCsvResponse> {
        const response = await api.post<ImportCsvResponse>('/sheet-music/import-csv', dto);
        return response.data;
    },

    async exportCsv(params?: SheetMusicQueryParams): Promise<Blob> {
        const response = await api.get('/sheet-music/export-csv', {
            params,
            responseType: 'blob',
        });
        return response.data;
    },

    async exportPdf(params?: SheetMusicQueryParams): Promise<Blob> {
        const response = await api.get('/sheet-music/export-pdf', {
            params,
            responseType: 'blob',
        });
        return response.data;
    },

    async toggleBookmark(id: number): Promise<{ bookmarked: boolean }> {
        const response = await api.post<{ bookmarked: boolean }>(`/sheet-music/${id}/bookmark`);
        return response.data;
    },

    // Helper: Download CSV export
    // Helper: Download Blob export
    downloadBlob(blob: Blob, filename: string) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    // Legacy support or alias
    downloadCsvBlob(blob: Blob, filename: string = 'sheet-music-export.csv') {
        this.downloadBlob(blob, filename);
    },
};

export default sheetMusicService;
