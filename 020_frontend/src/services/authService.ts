import api from '@/lib/api';
import { storage } from '@/lib/storage';
import type { User, LoginDto, RegisterDto, AuthResponse } from '@/types';

export const authService = {
    async login(data: LoginDto): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    async register(data: RegisterDto): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    async getMe(): Promise<User> {
        const response = await api.get<{ user: User }>('/auth/me');
        return response.data.user;
    },

    async refreshToken(): Promise<{ token: string; refreshToken?: string }> {
        const response = await api.post<{ token: string; refreshToken?: string }>('/auth/refresh');
        return response.data;
    },

    async forgotPassword(email: string): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
        return response.data;
    },

    async resetPassword(token: string, password: string): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/auth/reset-password/${token}`, { password });
        return response.data;
    },

    logout() {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
    },

    setToken(token: string) {
        storage.setItem('accessToken', token);
    },

    setRefreshToken(token: string) {
        storage.setItem('refreshToken', token);
    },

    getToken(): string | null {
        return storage.getItem('accessToken');
    },

    getRefreshToken(): string | null {
        return storage.getItem('refreshToken');
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },
};

export default authService;
