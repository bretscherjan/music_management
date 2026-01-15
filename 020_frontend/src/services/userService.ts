import api from '@/lib/api';
import type {
    User,
    UpdateProfileDto,
    ChangePasswordDto,
    UpdateUserStatusDto,
    UpdateUserRoleDto,
    AdminUpdateUserDto
} from '@/types';

interface UsersQueryParams {
    status?: string;
    registerId?: number;
    role?: string;
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

    // Admin routes
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
};

export default userService;
