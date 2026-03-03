import api from '@/lib/api';

export interface LogEntry {
    id:        string;
    timestamp: string;
    level:     'INFO' | 'WARN' | 'ERROR';
    actor:     string;
    action:    string;
    info:      string;
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
};

export default logsService;
