import api from '@/lib/api';
import type {
    Poll,
    CreatePollDto,
    UpdatePollDto,
    CastVoteDto,
    CastVoteResponse,
    PollOption,
    PollAnalyticsData,
} from '@/types';

export const pollService = {
    async getAll(): Promise<Poll[]> {
        const response = await api.get<{ polls: Poll[] }>('/polls');
        return response.data.polls;
    },

    async getById(id: number): Promise<Poll> {
        const response = await api.get<{ poll: Poll }>(`/polls/${id}`);
        return response.data.poll;
    },

    async create(data: CreatePollDto): Promise<Poll> {
        const response = await api.post<{ poll: Poll }>('/polls', data);
        return response.data.poll;
    },

    async update(id: number, data: UpdatePollDto): Promise<Poll> {
        const response = await api.put<{ poll: Poll }>(`/polls/${id}`, data);
        return response.data.poll;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/polls/${id}`);
    },

    async castVote(id: number, data: CastVoteDto): Promise<CastVoteResponse> {
        const response = await api.post<CastVoteResponse>(`/polls/${id}/vote`, data);
        return response.data;
    },

    async addCustomOption(id: number, text: string): Promise<PollOption> {
        const response = await api.post<{ option: PollOption }>(`/polls/${id}/options`, { text });
        return response.data.option;
    },

    async getAnalytics(id: number): Promise<PollAnalyticsData> {
        const response = await api.get<PollAnalyticsData>(`/polls/${id}/analytics`);
        return response.data;
    },
};

export default pollService;
