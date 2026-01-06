
import { Client, type FileEntity, type CreateFolderDto } from '../api/web-api-client';

const client = new Client("");

export const FileService = {
    getAll: async (parentId?: number): Promise<FileEntity[]> => {
        return await client.filesAll(parentId);
    },

    createFolder: async (name: string, parentId?: number): Promise<FileEntity> => {
        const dto = { name, parentId, accessLevel: "Member" } as CreateFolderDto;
        return await client.folders(dto);
    },

    uploadFile: async (file: File, parentId?: number, accessLevel: string = "Member"): Promise<FileEntity> => {
        // Since the generated 'upload' method takes a 'Body' object which effectively maps to key-value pairs in standard JSON if not handled, 
        // AND the controller expects IFormFile (multipart/form-data), NSwag generated a method 'upload(body: Body)' with 'application/x-www-form-urlencoded' ??
        // Let's check the generated client 'upload' method again in my thought process.
        // It showed: headers: "Content-Type": "application/x-www-form-urlencoded".
        // This is WRONG for file upload.
        // I might need to manually handle the upload fetch here if the generated client is wrong.
        // NSwag openapi2tsclient often messes up multipart/form-data.

        // I'll implement a custom fetch for upload here to be safe.
        // Or try to use the client if I can pass FormData?
        // The generated client expects 'Body' interface/object and converts it to url-encoded string.

        const formData = new FormData();
        formData.append('file', file);
        if (parentId) formData.append('parentId', parentId.toString());
        formData.append('accessLevel', accessLevel);

        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const response = await fetch("/api/Files/upload", {
            method: "POST",
            headers: headers,
            body: formData
        });

        if (!response.ok) {
            throw new Error("File upload failed: " + response.statusText);
        }

        return await response.json() as FileEntity;
    },

    deleteFile: async (id: number): Promise<void> => {
        await client.files(id); // DELETE
    }
};
