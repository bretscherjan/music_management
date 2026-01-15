import api from '@/lib/api';
import type { FileEntity, FileQueryParams, UploadFileDto } from '@/types';

export const fileService = {
    async getAll(params?: FileQueryParams): Promise<FileEntity[]> {
        const response = await api.get<{ files: FileEntity[] }>('/files', { params });
        return response.data.files;
    },

    async getInfo(id: number): Promise<FileEntity> {
        const response = await api.get<{ file: FileEntity }>(`/files/${id}/info`);
        return response.data.file;
    },

    async upload(file: File, options?: UploadFileDto): Promise<FileEntity> {
        const formData = new FormData();
        formData.append('file', file);

        if (options?.visibility) {
            formData.append('visibility', options.visibility);
        }
        if (options?.targetRegisterId) {
            formData.append('targetRegisterId', options.targetRegisterId.toString());
        }
        if (options?.eventId) {
            formData.append('eventId', options.eventId.toString());
        }
        if (options?.folder) {
            formData.append('folder', options.folder);
        }

        const response = await api.post<{ file: FileEntity }>('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.file;
    },

    async download(id: number): Promise<Blob> {
        const response = await api.get(`/files/${id}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/files/${id}`);
    },

    // Helper: Trigger browser download
    async downloadAndSave(id: number, filename: string): Promise<void> {
        const blob = await this.download(id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    async getFolders(): Promise<string[]> {
        const response = await api.get<{ folders: string[] }>('/files/folders');
        return response.data.folders;
    },

    async deleteFolder(folder: string): Promise<void> {
        await api.delete('/files/folders', { params: { folder } });
    },

    async createFolder(folder: string): Promise<void> {
        await api.post('/files/create-folder', { folder });
    },

    async updateAccess(id: number, data: any): Promise<void> {
        await api.put(`/files/${id}/access`, data);
    },
};

export default fileService;
