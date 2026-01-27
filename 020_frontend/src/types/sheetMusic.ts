// Sheet Music Types - mirrors Prisma SheetMusic model

import type { FileEntity } from './file';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SheetMusic {
    id: number;
    title: string;
    composer?: string | null;
    arranger?: string | null;
    genre?: string | null;
    difficulty?: Difficulty | null;
    publisher?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    bookmarks?: SheetMusicBookmark[];
    files?: FileEntity[];
}

export interface SheetMusicBookmark {
    id: number;
    userId: number;
    user: {
        id: number;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

export interface EventSheetMusic {
    id: number;
    eventId: number;
    sheetMusicId: number;
    position: number;
    sheetMusic: SheetMusic;
    createdAt: string;
}

// DTOs for API operations
export interface CreateSheetMusicDto {
    title: string;
    composer?: string;
    arranger?: string;
    genre?: string;
    difficulty?: Difficulty;
    publisher?: string;
    notes?: string;
}

export interface UpdateSheetMusicDto {
    title?: string;
    composer?: string;
    arranger?: string;
    genre?: string;
    difficulty?: Difficulty;
    publisher?: string;
    notes?: string;
}

export interface SheetMusicQueryParams {
    search?: string;
    genre?: string;
    difficulty?: Difficulty;
    bookmarkedBy?: number;
    sort?: 'title' | 'composer' | 'arranger' | 'genre' | 'difficulty' | 'createdAt';
    page?: number;
    limit?: number;
}

export interface SheetMusicPaginationResponse {
    sheetMusic: SheetMusic[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ImportCsvDto {
    mode: 'add' | 'update';
    data: string;
}

export interface ImportCsvResponse {
    message: string;
    imported: number;
    updated: number;
    errors: number;
    errorDetails: Array<{ line: number; error: string }>;
}

export interface AddSheetToEventDto {
    sheetMusicId: number;
    position?: number;
}

// Helper: Get admin color based on user ID
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
