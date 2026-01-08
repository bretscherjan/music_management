import { ApiClient } from '../api/generated/ApiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141';

/**
 * Custom fetch implementation that adds the JWT token to the Authorization header.
 */
const authenticatedFetch = async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
    const token = localStorage.getItem('jwt');
    const headers = new Headers(init?.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const newInit = { ...init, headers };
    return window.fetch(url, newInit);
};

/**
 * Singleton instance of the ApiClient with authentication support.
 * Usage: apiService.controllerMethod(...)
 */
export const apiService = new ApiClient(API_BASE_URL, { fetch: authenticatedFetch });
