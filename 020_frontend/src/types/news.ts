// News Types - mirrors Prisma News model

import type { User } from './user';

export interface News {
    id: number;
    title: string;
    content: string;
    authorId: number;
    author?: User;
    createdAt: string;
    updatedAt: string;
}

// DTOs for API operations
export interface CreateNewsDto {
    title: string;
    content: string;
}

export interface UpdateNewsDto {
    title?: string;
    content?: string;
}

export interface NewsQueryParams {
    limit?: number;
    offset?: number;
}
