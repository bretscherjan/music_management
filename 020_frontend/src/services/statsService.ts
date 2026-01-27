import api from '@/lib/api';

export interface RepertoireStatItem {
    id: number;
    title: string;
    composer: string | null;
    genre: string | null;
    playCount: number;
    lastPlayed: string | null;
    rehearsalCount: number;
    performanceCount: number;
}

export interface RepertoireStatsParams {
    startDate?: string;
    endDate?: string;
    category?: string;
}

export const statsService = {
    getRepertoireStats: async (params?: RepertoireStatsParams) => {
        const response = await api.get<RepertoireStatItem[]>('/stats/repertoire', { params });
        return response.data;
    },

    exportRepertoirePdf: async (params?: RepertoireStatsParams) => {
        const response = await api.get('/stats/repertoire/export', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    getAttendanceStats: async (params?: RepertoireStatsParams) => {
        const response = await api.get<AttendanceStatsResponse>('/stats/attendance', { params });
        return response.data;
    },

    exportAttendancePdf: async (params?: RepertoireStatsParams) => {
        const response = await api.get('/stats/attendance/export', {
            params,
            responseType: 'blob'
        });
        return response.data;
    }
};

export interface AttendanceStatsResponse {
    distribution: { name: string; value: number }[];
    attendees: {
        id: number;
        name: string;
        register: string;
        present: number;
        excused: number;
        unexcused: number;
        total: number;
        rate: number;
        profilePicture?: string | null
    }[]; // Full detailed list
    topAttendees: { id: number; name: string; count: number; profilePicture?: string | null }[]; // Top 10 for chart
}
