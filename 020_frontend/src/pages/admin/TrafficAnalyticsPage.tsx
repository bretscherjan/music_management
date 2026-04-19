import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { Eye, Users, Globe, TrendingUp, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { analyticsService, type TrafficPeriod } from '@/services/analyticsService';
import { cn } from '@/lib/utils';

const PERIODS: { label: string; value: TrafficPeriod }[] = [
    { label: '24 Std.', value: '24h' },
    { label: '7 Tage', value: '7d' },
    { label: '30 Tage', value: '30d' },
];

const FLAG_MAP: Record<string, string> = {
    CH: '🇨🇭', DE: '🇩🇪', AT: '🇦🇹', US: '🇺🇸', GB: '🇬🇧',
    FR: '🇫🇷', IT: '🇮🇹', NL: '🇳🇱', ES: '🇪🇸', PL: '🇵🇱',
};

function KPICard({
    icon: Icon,
    title,
    value,
    sub,
    className,
}: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    sub?: string;
    className?: string;
}) {
    return (
        <Card className={cn('rounded-2xl shadow-sm', className)}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">{title}</p>
                        <p className="text-3xl font-bold mt-1">{value}</p>
                        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
                    </div>
                    <div className="rounded-xl bg-red-50 p-2.5">
                        <Icon className="h-5 w-5 text-red-500" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function TrafficAnalyticsPage() {
    const [period, setPeriod] = useState<TrafficPeriod>('7d');

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['trafficStats', period],
        queryFn: () => analyticsService.getTrafficStats(period),
    });

    const { data: timeseries, isLoading: tsLoading } = useQuery({
        queryKey: ['trafficTimeseries', period],
        queryFn: () => analyticsService.getTimeseries(period),
    });

    const { data: pages, isLoading: pagesLoading } = useQuery({
        queryKey: ['trafficPages', period],
        queryFn: () => analyticsService.getPopularPages(period),
    });

    const { data: geo } = useQuery({
        queryKey: ['trafficGeo', period],
        queryFn: () => analyticsService.getGeoDistribution(period),
    });

    const isLoading = statsLoading || tsLoading || pagesLoading;

    const deviceBreakdown = stats?.deviceBreakdown ?? { desktop: 0, mobile: 0, tablet: 0 };
    const totalDevices = deviceBreakdown.desktop + deviceBreakdown.mobile + deviceBreakdown.tablet || 1;

    const topPages = pages?.pages?.slice(0, 8) ?? [];
    const maxPageViews = topPages[0]?.views ?? 1;

    return (
        <div className="space-y-6 p-6 max-w-screen-xl mx-auto">
            <PageHeader
                title="Traffic Analytics"
                description="Cookie-freie Besucheranalyse – datenschutzkonform"
            />

            {/* Period Toggle */}
            <div className="flex gap-2">
                {PERIODS.map((p) => (
                    <Button
                        key={p.value}
                        variant={period === p.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPeriod(p.value)}
                        className={period === p.value ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    icon={Eye}
                    title="Seitenaufrufe"
                    value={isLoading ? '…' : (stats?.totalViews ?? 0).toLocaleString('de-CH')}
                    sub={`Periode: ${period}`}
                />
                <KPICard
                    icon={Users}
                    title="Unique Visitors"
                    value={isLoading ? '…' : (stats?.uniqueVisitors ?? 0).toLocaleString('de-CH')}
                    sub="Tages-Hash (datenschutzkonform)"
                />
                <KPICard
                    icon={Globe}
                    title="Top-Land"
                    value={isLoading ? '…' : (stats?.topCountry ? `${FLAG_MAP[stats.topCountry] ?? '🌍'} ${stats.topCountry}` : '–')}
                />
                <KPICard
                    icon={TrendingUp}
                    title="Bounce Rate"
                    value={isLoading ? '…' : `${stats?.bounceRateEstimate ?? 0}%`}
                    sub="Geschätzt"
                />
            </div>

            {/* Line Chart + Device Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="rounded-2xl shadow-sm lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Traffic über Zeit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tsLoading ? (
                            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Laden…</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={timeseries?.series ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '0.75rem', fontSize: 12 }}
                                        labelStyle={{ fontWeight: 600 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="views"
                                        stroke="#ef4444"
                                        strokeWidth={2.5}
                                        dot={false}
                                        name="Aufrufe"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="visitors"
                                        stroke="#94a3b8"
                                        strokeWidth={1.5}
                                        dot={false}
                                        name="Visitors"
                                        strokeDasharray="4 2"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Gerätetypen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        {[
                            { icon: Monitor, label: 'Desktop', key: 'desktop' as const },
                            { icon: Smartphone, label: 'Mobile', key: 'mobile' as const },
                            { icon: Tablet, label: 'Tablet', key: 'tablet' as const },
                        ].map(({ icon: Icon, label, key }) => {
                            const count = deviceBreakdown[key];
                            const pct = Math.round((count / totalDevices) * 100);
                            return (
                                <div key={key}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <span>{label}</span>
                                        </div>
                                        <span className="text-sm font-semibold">{pct}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-red-500 h-2 rounded-full transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Popular Pages + Geo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Popular Pages Horizontal Bar */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Beliebteste Seiten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pagesLoading ? (
                            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Laden…</div>
                        ) : topPages.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">Keine Daten</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={Math.max(220, topPages.length * 36)}>
                                <BarChart
                                    layout="vertical"
                                    data={topPages}
                                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="path"
                                        width={120}
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 16) + '…' : v}
                                    />
                                    <RechartsTooltip contentStyle={{ borderRadius: '0.75rem', fontSize: 12 }} />
                                    <Bar dataKey="views" name="Aufrufe" radius={[0, 4, 4, 0]}>
                                        {topPages.map((_, i) => (
                                            <Cell key={i} fill={i === 0 ? '#ef4444' : '#fca5a5'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Geo Distribution */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Geo-Verteilung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!geo || geo.geo.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">Keine Geodaten</p>
                        ) : (
                            <div className="space-y-3">
                                {geo.geo.slice(0, 10).map((entry, i) => {
                                    const maxViews = geo.geo[0]?.views ?? 1;
                                    const pct = Math.round((entry.views / maxViews) * 100);
                                    return (
                                        <div key={entry.country ?? i}>
                                            <div className="flex items-center justify-between mb-1 text-sm">
                                                <span>
                                                    {FLAG_MAP[entry.country] ?? '🌍'} {entry.country ?? 'Unbekannt'}
                                                </span>
                                                <span className="font-semibold">{entry.views.toLocaleString('de-CH')}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div
                                                    className="bg-red-400 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
