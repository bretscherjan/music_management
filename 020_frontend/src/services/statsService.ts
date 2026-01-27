import api from '@/lib/api';
import type { AttendanceSummaryResponse } from '@/types';

export const statsService = {
    async getAttendanceSummary(params?: { startDate?: string; endDate?: string; registerId?: number }): Promise<AttendanceSummaryResponse> {
        const response = await api.get<AttendanceSummaryResponse>('/stats/attendance-summary', { params });
        return response.data;
    }
};

export default statsService;
