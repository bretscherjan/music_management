import api from '@/lib/api';
import type {
    User,
    UpdateProfileDto,
    ChangePasswordDto,
    UpdateUserStatusDto,
    UpdateUserRoleDto,
    AdminUpdateUserDto,
    AdminCreateUserDto,
    NotificationSettings,
    Permission
} from '@/types';

interface UsersQueryParams {
    status?: string;
    registerId?: number;
    role?: string;
    type?: string;
}

export const userService = {
    // Self-service routes
    async getProfile(): Promise<User> {
        const response = await api.get<{ user: User }>('/users/profile');
        return response.data.user;
    },

    async updateProfile(data: UpdateProfileDto): Promise<User> {
        const response = await api.put<{ user: User }>('/users/profile', data);
        return response.data.user;
    },

    async changePassword(data: ChangePasswordDto): Promise<void> {
        await api.put('/users/profile/password', data);
    },

    async updateProfilePicture(pictureUrl: string): Promise<User> {
        const response = await api.put<{ user: User }>('/users/profile/picture', {
            profilePicture: pictureUrl
        });
        return response.data.user;
    },

    async getNotificationSettings(): Promise<NotificationSettings> {
        const response = await api.get<{ settings: NotificationSettings }>('/users/me/notifications');
        return response.data.settings;
    },

    async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
        const response = await api.put<{ settings: NotificationSettings }>('/users/me/notifications', settings);
        return response.data.settings;
    },

    // Admin routes
    async create(data: AdminCreateUserDto): Promise<User> {
        const response = await api.post<{ user: User }>('/users', data);
        return response.data.user;
    },

    async getAll(params?: UsersQueryParams): Promise<User[]> {
        const response = await api.get<{ users: User[] }>('/users', { params });
        return response.data.users;
    },

    async getById(id: number): Promise<User> {
        const response = await api.get<{ user: User }>(`/users/${id}`);
        return response.data.user;
    },

    async update(id: number, data: AdminUpdateUserDto): Promise<User> {
        const response = await api.put<{ user: User }>(`/users/${id}`, data);
        return response.data.user;
    },

    // Alias for explicit naming
    async updateUser(id: number, data: AdminUpdateUserDto): Promise<User> {
        return this.update(id, data);
    },

    async updateStatus(id: number, data: UpdateUserStatusDto): Promise<User> {
        const response = await api.put<{ user: User }>(`/users/${id}/status`, data);
        return response.data.user;
    },

    async updateRole(id: number, data: UpdateUserRoleDto): Promise<User> {
        const response = await api.put<{ user: User }>(`/users/${id}/role`, data);
        return response.data.user;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/users/${id}`);
    },

    async getAllPermissions(): Promise<Permission[]> {
        const response = await api.get<{ permissions: Permission[] }>('/users/permissions');
        return response.data.permissions;
    },

    async updatePermissions(userId: number, permissionKeys: string[]): Promise<void> {
        await api.patch(`/users/${userId}/permissions`, { permissionKeys });
    },
};

export default userService;
