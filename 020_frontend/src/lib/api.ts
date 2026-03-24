import axios from 'axios';
import { storage } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

export const resolveMediaUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || 
        trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed;
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed;
    return `${API_BASE_URL}/${cleanPath}`;
};

export const getMediaUrl = (path: string) => resolveMediaUrl(path);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Public API instance - no auth token attached (for public pages)
export const publicApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = storage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip interceptor for login requests to avoid infinite loops
        if (originalRequest.url?.includes('/auth/login')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Try to refresh token
            const refreshToken = storage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                        headers: { Authorization: `Bearer ${refreshToken}` }
                    });

                    const { token, refreshToken: newRefreshToken } = response.data;
                    storage.setItem('accessToken', token);
                    if (newRefreshToken) {
                        storage.setItem('refreshToken', newRefreshToken);
                    }
                    originalRequest.headers.Authorization = `Bearer ${token}`;

                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, logout user
                    storage.removeItem('accessToken');
                    storage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, redirect to login
                storage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
