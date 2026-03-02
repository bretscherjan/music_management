import api from '@/lib/api';

// ── Shared filter params ───────────────────────────────────────────────────────
export interface AnalyticsParams {
    days?: number
    role?: 'all' | 'member' | 'admin'
    registerId?: number
    type?: 'all' | 'interaction' | 'visit'
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HourActivity    { hour: number; count: number }
export interface WeekdayActivity { dayOfWeek: number; label: string; count: number }
export interface PeakTimesResponse { hours: HourActivity[]; weekdays: WeekdayActivity[] }

export interface FeatureUsageItem { action: string; entity: string; count: number }

export interface OnlineUser {
    id: number; firstName: string; lastName: string
    role: string; register: string | null; lastSeen: string
}
export interface OnlineNowResponse { minutes: number; count: number; users: OnlineUser[] }

export interface RegisterActivity {
    register: string; _total: number
    LOGIN?: number; FILE_ACCESS?: number; ATTENDANCE_UPDATE?: number
    [key: string]: number | string | undefined
}

export interface TopUser {
    id: number; firstName: string; lastName: string
    role: string; register: string | null
    total: number; logins: number; fileDownloads: number; attendanceUpdates: number
}

export interface InactiveUser {
    id: number; firstName: string; lastName: string; email: string
    role: string; lastSeenAt: string | null; daysInactive: number | null
    register: { name: string } | null
}
export interface InactiveUsersResponse { days: number; users: InactiveUser[] }

export interface NewlyRegisteredUser {
    id: number; firstName: string; lastName: string; email: string
    role: string; createdAt: string; firstSeenAt: string | null
    register: { name: string } | null
    daysSinceCreation: number; isActive: boolean
}
export interface NewlyRegisteredResponse { days: number; count: number; users: NewlyRegisteredUser[] }

// ── Service ───────────────────────────────────────────────────────────────────

export const engagementService = {
    getPeakTimes: async (p?: AnalyticsParams): Promise<PeakTimesResponse> =>
        (await api.get('/audit/analytics/peak-times', { params: p })).data,

    getFeatureUsage: async (p?: AnalyticsParams): Promise<FeatureUsageItem[]> =>
        (await api.get('/audit/analytics/feature-usage', { params: p })).data,

    getOnlineNow: async (minutes = 15): Promise<OnlineNowResponse> =>
        (await api.get('/audit/analytics/online-now', { params: { minutes } })).data,

    getActivityByRegister: async (p?: Pick<AnalyticsParams, 'days'>): Promise<RegisterActivity[]> =>
        (await api.get('/audit/analytics/activity-by-register', { params: p })).data,

    getTopUsers: async (p?: AnalyticsParams & { action?: string; limit?: number }): Promise<TopUser[]> =>
        (await api.get('/audit/analytics/top-users', { params: p })).data,

    getInactiveUsers: async (p?: AnalyticsParams): Promise<InactiveUsersResponse> =>
        (await api.get('/audit/analytics/inactive-users', { params: p })).data,

    getNewlyRegisteredUsers: async (p?: AnalyticsParams): Promise<NewlyRegisteredResponse> =>
        (await api.get('/audit/analytics/newly-registered', { params: p })).data,
};