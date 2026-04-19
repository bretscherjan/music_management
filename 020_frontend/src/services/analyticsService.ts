import api from '@/lib/api';

export type TrafficPeriod = '24h' | '7d' | '30d';

export interface TrafficStats {
    period: TrafficPeriod;
    totalViews: number;
    uniqueVisitors: number;
    topCountry: string | null;
    deviceBreakdown: { mobile: number; tablet: number; desktop: number };
    bounceRateEstimate: number;
}

export interface TimeseriesPoint {
    label: string;
    views: number;
    visitors: number;
}

export interface PopularPage {
    path: string;
    views: number;
}

export interface GeoEntry {
    country: string;
    views: number;
}

export const analyticsService = {
    async getTrafficStats(period: TrafficPeriod = '7d'): Promise<TrafficStats> {
        const res = await api.get<TrafficStats>('/analytics/traffic', { params: { period } });
        return res.data;
    },

    async getTimeseries(period: TrafficPeriod = '7d'): Promise<{ period: string; series: TimeseriesPoint[] }> {
        const res = await api.get('/analytics/traffic/timeseries', { params: { period } });
        return res.data;
    },

    async getPopularPages(period: TrafficPeriod = '7d', limit = 10): Promise<{ period: string; pages: PopularPage[] }> {
        const res = await api.get('/analytics/traffic/pages', { params: { period, limit } });
        return res.data;
    },

    async getGeoDistribution(period: TrafficPeriod = '7d'): Promise<{ period: string; geo: GeoEntry[] }> {
        const res = await api.get('/analytics/traffic/geo', { params: { period } });
        return res.data;
    },
};
