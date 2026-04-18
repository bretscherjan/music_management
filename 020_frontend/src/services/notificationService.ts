import api from '@/lib/api';

export type ReadCategory = 'EVENTS' | 'NEWS' | 'POLLS';

export interface UnreadCounts {
    chat: number;
    events: number;
    news: number;
    polls: number;
}

export interface UnreadCountsResponse {
    counts: UnreadCounts;
    lastCheckedAt: {
        events: string | null;
        news: string | null;
        polls: string | null;
    };
}

const notificationService = {
    async getUnreadCounts(): Promise<UnreadCountsResponse> {
        const res = await api.get<UnreadCountsResponse>('/notifications/unread-counts');
        return res.data;
    },

    async markCategoryRead(category: ReadCategory): Promise<void> {
        await api.post('/notifications/mark-read', { category });
    },
};

export default notificationService;
