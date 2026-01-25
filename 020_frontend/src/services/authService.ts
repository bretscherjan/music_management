import api from '@/lib/api';
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

    async refreshToken(): Promise<{ token: string }> {
        const response = await api.post<{ token: string }>('/auth/refresh');
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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },

    setToken(token: string) {
        localStorage.setItem('accessToken', token);
    },

    getToken(): string | null {
        return localStorage.getItem('accessToken');
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },
};

export default authService;
