// File Types - mirrors Prisma File model

export type FileVisibility = 'all' | 'admin' | 'register' | 'limit';

// Access Types
export type AccessType = 'ALLOW' | 'DENY';
export type AccessTargetType = 'USER' | 'REGISTER' | 'ADMIN_ONLY';

export interface FileAccessRule {
    id?: number;
    accessType: AccessType;
    targetType: AccessTargetType;
    userId?: number | null;
    registerId?: number | null;
}

export interface FileEntity {
    id: number;
    filename: string;
    originalName: string;
    path: string;
    mimetype: string;
    size: number;
    visibility: FileVisibility;
    folder: string;
    targetRegisterId?: number | null;
    eventId?: number | null;
    accessRules?: FileAccessRule[];
    createdAt: string;
}

// DTOs for API operations
export interface UploadFileDto {
    visibility?: FileVisibility;
    targetRegisterId?: number;
    eventId?: number;
    folder?: string;
    folderId?: number | null;
    accessRules?: string; // JSON string because of FormData
}

export interface FileQueryParams {
    visibility?: FileVisibility;
    targetRegisterId?: number;
    eventId?: number;
    folder?: string;
    folderId?: number | null;
}

export interface Folder {
    id: number;
    name: string;
    parentId: number | null;
    createdAt: string;
    updatedAt: string;
    accessRules?: FileAccessRule[];
    _count?: {
        files: number;
        children: number;
    };
}

export interface FolderBreadcrumb {
    id: number;
    name: string;
}

export interface FolderContentsResponse {
    folders: Folder[];
    files: FileEntity[];
    breadcrumbs: FolderBreadcrumb[];
    currentFolder: {
        id: number | null;
        name: string;
        parentId: number | null;
    };
}
