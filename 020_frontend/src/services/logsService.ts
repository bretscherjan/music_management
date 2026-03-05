import api from '@/lib/api';

export interface LogEntry {
    id:        string;
    timestamp: string;
    level:     'INFO' | 'WARN' | 'ERROR';
    actor:     string;
    userId:    number | null;
    email:     string | null;
    ip:        string | null;
    action:    string;
    info:      string;
    error:     string | null;
    message:   string;
}

export interface LogsResponse {
    count:   number;
    entries: LogEntry[];
}

export interface LogStats {
    total: number;
    INFO:  number;
    WARN:  number;
    ERROR: number;
}

const logsService = {
    getLogs: async (limit = 50, level?: string): Promise<LogsResponse> => {
        const params: Record<string, string | number> = { limit };
        if (level && level !== 'all') params.level = level;
        return (await api.get('/logs', { params })).data;
    },

    getStats: async (): Promise<LogStats> =>
        (await api.get('/logs/stats')).data,

    getLogsByDate: async (date: string, level?: string, limit = 500): Promise<LogsResponse> => {
        const params: Record<string, string | number> = { date, limit };
        if (level && level !== 'all') params.level = level;
        return (await api.get('/logs/date', { params })).data;
    },

    getAvailableDates: async (): Promise<{ dates: string[] }> =>
        (await api.get('/logs/available-dates')).data,
};

export default logsService;
