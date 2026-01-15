import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://musig-elgg:3004/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
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
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
                    });

                    const { token } = response.data;
                    localStorage.setItem('accessToken', token);
                    originalRequest.headers.Authorization = `Bearer ${token}`;

                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, logout user
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, redirect to login
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
