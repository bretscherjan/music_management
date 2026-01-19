// User Types - mirrors Prisma User model

export type UserStatus = 'active' | 'passive' | 'former';
export type UserRole = 'member' | 'admin';

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    profilePicture?: string | null;
    status: UserStatus;
    role: UserRole;
    registerId?: number | null;
    register?: {
        id: number;
        name: string;
    } | null;
    createdAt: string;
    updatedAt: string;
    calendarToken?: string;
}

// DTOs for API operations
export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string | null;
    profilePicture?: string | null;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UpdateUserStatusDto {
    status: UserStatus;
}

export interface UpdateUserRoleDto {
    role: UserRole;
}

export interface AdminUpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string | null;
    status?: UserStatus;
    role?: UserRole;
    registerId?: number | null;
}
