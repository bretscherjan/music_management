import api from '@/lib/api';
import type { CalendarPreferences } from '@/types';

export const calendarService = {
    async getPreferences(): Promise<CalendarPreferences> {
        const response = await api.get<{ preferences: CalendarPreferences }>('/users/me/calendar/preferences');
        return response.data.preferences;
    },

    async savePreferences(prefs: Partial<CalendarPreferences>): Promise<CalendarPreferences> {
        const response = await api.put<{ preferences: CalendarPreferences }>('/users/me/calendar/preferences', prefs);
        return response.data.preferences;
    },

    async rotateToken(): Promise<{ calendarToken: string }> {
        const response = await api.post<{ calendarToken: string }>('/users/me/calendar/rotate-token');
        return response.data;
    },
};
