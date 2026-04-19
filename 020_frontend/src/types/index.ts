// Barrel export for all types
export * from './user';
export * from './event';
export * from './attendance';
export * from './register';
export * from './news';
export * from './file';
export * from './sheetMusic';
export * from './stats';
export * from './poll';
export * from './calendar';

// Common API response types
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface ApiError {
    message: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

// Auth types
export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    registerId?: number;
}

export interface AuthResponse {
    user: import('./user').User;
    token: string;
    refreshToken?: string;
}
