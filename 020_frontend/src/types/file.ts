// File Types - mirrors Prisma File model

export type FileVisibility = 'all' | 'admin' | 'register' | 'limit';

// Access Types
export type AccessType = 'ALLOW' | 'DENY';
export type AccessTargetType = 'USER' | 'REGISTER';

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
    accessRules?: string; // JSON string because of FormData
}

export interface FileQueryParams {
    visibility?: FileVisibility;
    targetRegisterId?: number;
    eventId?: number;
    folder?: string;
}
