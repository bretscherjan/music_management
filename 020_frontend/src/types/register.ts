// Register Types - mirrors Prisma Register model

import type { User } from './user';

export interface Register {
    id: number;
    name: string;
    users?: User[];
}

// DTOs for API operations
export interface CreateRegisterDto {
    name: string;
    assignUserIds?: number[];
}

export interface UpdateRegisterDto {
    name: string;
    assignUserIds?: number[];
}
