// User Types - mirrors Prisma User model

export type UserStatus = 'active' | 'passive' | 'former';
export type UserRole = 'member' | 'admin';
export type UserType = 'REGULAR' | 'GUEST';

export interface Permission {
    id: number;
    key: string;
    description?: string | null;
    category?: string | null;
}

export interface PermissionTemplate {
    id: number;
    systemKey?: string | null;
    name: string;
    description?: string | null;
    permissionKeys: string[];
    isSystem: boolean;
    createdBy?: number | null;
    updatedBy?: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface UserPermission {
    userId: number;
    permissionId: number;
    grantedAt: string;
    grantedBy?: number | null;
    permission: Permission;
}

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    profilePicture?: string | null;
    status: UserStatus;
    role: UserRole;
    type: UserType;
    expiresAt?: string | null;
    registerId?: number | null;
    register?: {
        id: number;
        name: string;
    } | null;
    notificationSettings?: NotificationSettings;
    createdAt: string;
    updatedAt: string;
    calendarToken?: string;
    permissions?: UserPermission[];
}

export interface NotificationSettings {
    id: number;
    userId: number;
    // Email notifications
    notifyOnEventCreate: boolean;
    notifyOnEventUpdate: boolean;
    notifyOnEventDelete: boolean;
    notifyOnFileUpload: boolean;
    notifyOnFileDelete: boolean;
    // User-Individual Reminder Settings
    reminderSettings?: ReminderSettingsPerCategory;

    // Push notifications
    pushNewEvents: boolean;
    pushEventUpdates: boolean;
    pushEventCancellations: boolean;
    pushNewFiles: boolean;
    pushFileDeleted: boolean;
}

export interface ReminderSettingsPerCategory {
    rehearsal?: CategoryReminderSettings;
    performance?: CategoryReminderSettings;
    other?: CategoryReminderSettings;
}

export interface CategoryReminderSettings {
    enabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    minutesBefore: number[]; // Array of minutes (e.g. [60, 1440])
    onlyIfAttending: boolean; // false = all invited, true = only "yes"
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
    type?: UserType;
    expiresAt?: string | null;
    registerId?: number | null;
}

export interface AdminCreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber?: string | null;
    status?: UserStatus;
    role?: UserRole;
    type?: UserType;
    expiresAt?: string | null;
    registerId?: number | null;
}
