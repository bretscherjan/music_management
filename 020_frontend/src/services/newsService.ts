import api from '@/lib/api';
import type { News, CreateNewsDto, UpdateNewsDto, NewsQueryParams } from '@/types';

export const newsService = {
    async getAll(params?: NewsQueryParams): Promise<News[]> {
        const response = await api.get<{ news: News[] }>('/news', { params });
        return response.data.news;
    },

    async getById(id: number): Promise<News> {
        const response = await api.get<{ news: News }>(`/news/${id}`);
        return response.data.news;
    },

    async create(data: CreateNewsDto): Promise<News> {
        const response = await api.post<{ news: News }>('/news', data);
        return response.data.news;
    },

    async update(id: number, data: UpdateNewsDto): Promise<News> {
        const response = await api.put<{ news: News }>(`/news/${id}`, data);
        return response.data.news;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/news/${id}`);
    },

    // Helper: Get recent news
    async getRecent(limit: number = 5): Promise<News[]> {
        return this.getAll({ limit, offset: 0 });
    },
};

export default newsService;
