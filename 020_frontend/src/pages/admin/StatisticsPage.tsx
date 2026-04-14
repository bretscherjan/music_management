
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsService, type RepertoireStatsParams } from '@/services/statsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, Filter, Music, TrendingUp, BarChart2, Clock, Users, Award, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';
import { PdfExportDialog } from '@/components/ui/PdfExportDialog';
import type { PdfOptions } from '@/utils/pdfTheme';
import { cn } from '@/lib/utils';

export function StatisticsPage() {
    const [activeTab, setActiveTab] = useState<'repertoire' | 'attendance'>('repertoire');
    // State for filters
    const [timeRange, setTimeRange] = useState('all'); // all, lastyear, currentyear
    const [eventCategory, setEventCategory] = useState<string>('all');

    // Calculate dates based on timeRange
    const getDateParams = (): RepertoireStatsParams => {
        const params: RepertoireStatsParams = {};
        const now = new Date();

        if (timeRange === 'currentyear') {
            params.startDate = new Date(now.getFullYear(), 0, 1).toISOString();
            params.endDate = now.toISOString();
        } else if (timeRange === 'lastyear') {
            params.startDate = new Date(now.getFullYear() - 1, 0, 1).toISOString();
            params.endDate = new Date(now.getFullYear() - 1, 11, 31).toISOString();
        }

        if (eventCategory !== 'all') {
            params.category = eventCategory;
        }

        return params;
    };

    // Fetch Repertoire Data
    const { data: repertoireStats, isLoading: isLoadingRepertoire } = useQuery({
        queryKey: ['repertoireStats', timeRange, eventCategory],
        queryFn: () => statsService.getRepertoireStats(getDateParams()),
        enabled: activeTab === 'repertoire'
    });

    // Fetch Attendance Data
    const { data: attendanceStats, isLoading: isLoadingAttendance } = useQuery({
        queryKey: ['attendanceStats', timeRange], // attendance doesn't use eventCategory usually, but backend logic allows filtering if we passed it. Let's keep it consistent IF backend supports it. Backend getAttendanceStats supports start/end date.
        queryFn: () => statsService.getAttendanceStats({ ...getDateParams() }), // Passing category too if needed, though backend currently only uses date for attendance in my impl.
        enabled: activeTab === 'attendance'
    });

    const handleDownloadPdf = async (opts: PdfOptions) => {
        try {
            const blob = activeTab === 'repertoire'
                ? await statsService.exportRepertoirePdf(getDateParams(), opts)
                : await statsService.exportAttendancePdf(getDateParams(), opts);

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${activeTab}-statistik-${timeRange}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('PDF erfolgreich heruntergeladen');
        } catch (e) {
            toast.error('Fehler beim Exportieren des PDFs');
        }
    };

    // Prepare chart data for Repertoire
    const top10Repertoire = repertoireStats?.slice(0, 10).map(s => ({
        name: s.title.length > 20 ? s.title.substring(0, 20) + '...' : s.title,
        fullTitle: s.title,
        total: s.playCount,
        rehearsal: s.rehearsalCount,
        performance: s.performanceCount
    })) || [];

    const distributionRepertoire = repertoireStats ? [
        { name: '0 Einsätze', value: repertoireStats.filter(s => s.playCount === 0).length },
        { name: '1-5 Einsätze', value: repertoireStats.filter(s => s.playCount > 0 && s.playCount <= 5).length },
        { name: '6-20 Einsätze', value: repertoireStats.filter(s => s.playCount > 5 && s.playCount <= 20).length },
        { name: '> 20 Einsätze', value: repertoireStats.filter(s => s.playCount > 20).length },
    ].filter(d => d.value > 0) : [];

    // Prepare chart data for Attendance
    // Backend now returns 'topAttendees' pre-sorted for us
    const top10Attendance = attendanceStats?.topAttendees || [];

    // Chart color palette — maps to CSS chart tokens for brand consistency
    const COLORS = [
        'hsl(var(--chart-1))',   // Brand Red
        'hsl(var(--chart-3))',   // Amber
        'hsl(var(--chart-2))',   // Indigo
        'hsl(var(--chart-4))',   // Emerald
    ];
    const ATTENDANCE_COLORS = {
        'PRESENT':  'hsl(var(--chart-4))',   // Emerald
        'EXCUSED':  'hsl(var(--chart-3))',   // Amber
        'UNEXCUSED':'hsl(var(--chart-1))',   // Brand Red
    };

    const isLoading = activeTab === 'repertoire' ? isLoadingRepertoire : isLoadingAttendance;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Statistiken</h1>
                    <p className="text-muted-foreground text-sm">Auswertung von Repertoire und Anwesenheit</p>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[160px] sm:w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Zeitraum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Gesamter Zeitraum</SelectItem>
                            <SelectItem value="currentyear">Dieses Jahr ({new Date().getFullYear()})</SelectItem>
                            <SelectItem value="lastyear">Letztes Jahr ({new Date().getFullYear() - 1})</SelectItem>
                        </SelectContent>
                    </Select>

                    {activeTab === 'repertoire' && (
                        <Select value={eventCategory} onValueChange={setEventCategory}>
                            <SelectTrigger className="w-[160px] sm:w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Kategorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Kategorien</SelectItem>
                                <SelectItem value="rehearsal">Nur Proben</SelectItem>
                                <SelectItem value="performance">Nur Auftritte</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    <PdfExportDialog
                        trigger={
                            <Button className="whitespace-nowrap">
                                <Download className="mr-2 h-4 w-4" />
                                Export PDF
                            </Button>
                        }
                        title={activeTab === 'repertoire' ? 'Repertoire exportieren' : 'Anwesenheit exportieren'}
                        onExport={handleDownloadPdf}
                    />
                </div>
            </div>

            {/* Tabs Navigation – Segmented Control */}
            <div className="overflow-x-auto">
                <div className="segmented-control">
                    <button
                        onClick={() => setActiveTab('repertoire')}
                        className={`segmented-control-option${activeTab === 'repertoire' ? ' is-active' : ''}`}
                    >
                        Repertoire
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`segmented-control-option${activeTab === 'attendance' ? ' is-active' : ''}`}
                    >
                        Anwesenheit
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                        <p className="text-sm">Lade Statistiken...</p>
                    </div>
                </div>
            )}

            {!isLoading && activeTab === 'repertoire' && (
                <div className="space-y-6 animate-in fade-in duration-500">

                    {/* ── KPI Summary Cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KpiCard
                            icon={Music}
                            label="Stücke im Archiv"
                            value={repertoireStats?.length ?? 0}
                            accent
                        />
                        <KpiCard
                            icon={TrendingUp}
                            label="Meistgespielt"
                            value={repertoireStats?.[0]?.playCount ?? 0}
                            sub={repertoireStats?.[0]?.title}
                        />
                        <KpiCard
                            icon={BarChart2}
                            label="Probe-Einsätze"
                            value={repertoireStats?.reduce((s, r) => s + r.rehearsalCount, 0) ?? 0}
                        />
                        <KpiCard
                            icon={Award}
                            label="Auftritte gesamt"
                            value={repertoireStats?.reduce((s, r) => s + r.performanceCount, 0) ?? 0}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top 10 Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Top 10 Meistgespielte Stücke</CardTitle>
                                <CardDescription>Basierend auf der Anzahl Einträge in Setlisten</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={top10Repertoire}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={150} />
                                        <RechartsTooltip
                                            // @ts-ignore - Recharts type definition mismatch for this specific formatter signature but it works at runtime
                                            formatter={(value: any, name: any) => [value, name === 'total' ? 'Gesamt' : name === 'rehearsal' ? 'Proben' : 'Auftritte']}
                                            labelFormatter={(label, payload) => payload[0]?.payload.fullTitle || label}
                                        />
                                        <Legend />
                                        <Bar dataKey="rehearsal" stackId="a" fill="hsl(var(--chart-2))" name="Proben" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="performance" stackId="a" fill="hsl(var(--chart-1))" name="Auftritte" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Distribution Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Nutzungsverteilung</CardTitle>
                                <CardDescription>Wie viele Stücke werden wie oft gespielt?</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distributionRepertoire}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            fill="hsl(var(--chart-1))"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {distributionRepertoire.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend layout="vertical" verticalAlign="bottom" align="center" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Data Table */}
                    <Card className="shadow-sm rounded-2xl border-slate-100">
                        <CardContent className="p-0">
                            <ZoomableTableWrapper title="Detailliste: Repertoire">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40 border-b">
                                        <tr>
                                            <th className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Titel</th>
                                            <th className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Komponist</th>
                                            <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proben</th>
                                            <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Auftritte</th>
                                            <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gesamt</th>
                                            <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Zuletzt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repertoireStats?.slice(0, 50).map((item, idx) => (
                                            <tr key={item.id} className={cn(
                                                "border-b transition-colors hover:bg-muted/50",
                                                idx % 2 === 0 ? '' : 'bg-muted/20'
                                            )}>
                                                <td className="p-4 font-medium max-w-[160px]">
                                                    <div className="flex items-start gap-2">
                                                        <span className="w-5 h-5 flex-shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate">{item.title}</p>
                                                            <p className="text-xs text-muted-foreground sm:hidden">{item.composer || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-muted-foreground hidden sm:table-cell">{item.composer || '-'}</td>
                                                <td className="p-4 text-right tabular-nums">{item.rehearsalCount}</td>
                                                <td className="p-4 text-right tabular-nums hidden sm:table-cell">{item.performanceCount}</td>
                                                <td className="p-4 text-right">
                                                    <span className={cn(
                                                        "font-bold tabular-nums",
                                                        item.playCount >= 10 ? "text-primary" : "text-foreground"
                                                    )}>{item.playCount}</span>
                                                </td>
                                                <td className="p-4 text-right text-muted-foreground hidden md:table-cell">
                                                    {item.lastPlayed ? new Date(item.lastPlayed).toLocaleDateString('de-CH') : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ZoomableTableWrapper>
                            {repertoireStats && repertoireStats.length > 50 && (
                                <div className="text-center p-4 text-xs text-muted-foreground">
                                    Zeige die ersten 50 von {repertoireStats.length} Einträgen. Nutzen Sie den PDF Export für die volle Liste.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {!isLoading && activeTab === 'attendance' && (
                <div className="space-y-6 animate-in fade-in duration-500">

                    {/* ── KPI Summary Cards ── */}
                    {attendanceStats?.attendees && attendanceStats.attendees.length > 0 && (() => {
                        const attendees = attendanceStats.attendees;
                        const avgRate = Math.round(attendees.reduce((s, a) => s + a.rate, 0) / attendees.length);
                        const totalPresent = attendees.reduce((s, a) => s + a.present, 0);
                        const totalExcused = attendees.reduce((s, a) => s + a.excused, 0);
                        const totalUnexcused = attendees.reduce((s, a) => s + a.unexcused, 0);
                        return (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <KpiCard icon={Users} label="⌀ Anwesenheitsquote" value={`${avgRate}%`} accent />
                                <KpiCard icon={Award} label="Anwesend gesamt" value={totalPresent} />
                                <KpiCard icon={Clock} label="Entschuldigt" value={totalExcused} />
                                <KpiCard icon={UserX} label="Unentschuldigt" value={totalUnexcused} warn={totalUnexcused > 0} />
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Attendance Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Anwesenheitsquote</CardTitle>
                                <CardDescription>Verteilung der verifizierten Anwesenheiten</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                {attendanceStats?.distribution && attendanceStats.distribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={attendanceStats.distribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {attendanceStats.distribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[entry.name as keyof typeof ATTENDANCE_COLORS] || '#8884d8'} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend layout="vertical" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        Keine Daten verfügbar
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Attendees Chart (still relevant to visualize "top") */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Top Anwesende</CardTitle>
                                <CardDescription>Mitglieder mit den meisten verifizierten Anwesenheiten</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                {top10Attendance.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={top10Attendance}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={150} />
                                            <RechartsTooltip />
                                            <Bar dataKey="count" fill="var(--color-success)" name="Anwesenheiten" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        Keine Daten verfügbar
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* NEW: Full Attendance Table */}
                    <Card className="shadow-sm rounded-2xl border-slate-100">
                        <CardContent className="p-0">
                            <ZoomableTableWrapper title="Detailliste: Anwesenheit">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40 border-b">
                                        <tr>
                                            <th className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                                            <th className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Register</th>
                                            <th className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rate</th>
                                            <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anwesend</th>
                                            <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Entschuldigt</th>
                                            <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Unentschuldigt</th>
                                            <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceStats?.attendees?.map((item) => {
                                            const rateColor = item.rate >= 80 ? 'text-emerald-600' : item.rate >= 60 ? 'text-amber-600' : 'text-red-500';
                                            return (
                                                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-3 font-medium">
                                                        <div>
                                                            <p>{item.name}</p>
                                                            <p className="text-xs text-muted-foreground sm:hidden">{item.register || '-'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{item.register || '-'}</td>
                                                    <td className="p-3">
                                                        <span className={cn("font-semibold tabular-nums", rateColor)}>
                                                            {item.rate}%
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right tabular-nums text-emerald-700 font-medium">{item.present}</td>
                                                    <td className="p-3 text-right tabular-nums text-amber-600 hidden sm:table-cell">{item.excused}</td>
                                                    <td className="p-3 text-right tabular-nums text-red-500 hidden sm:table-cell">{item.unexcused}</td>
                                                    <td className="p-3 text-right font-bold text-foreground hidden md:table-cell">{item.total}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </ZoomableTableWrapper>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

// ── KPI Card sub-component ─────────────────────────────────────────────────────

interface KpiCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    accent?: boolean;
    warn?: boolean;
}

function KpiCard({ icon: Icon, label, value, sub, accent, warn }: KpiCardProps) {
    return (
        <div className={cn(
            "rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-1 bg-card",
            accent && "border-primary/20 bg-primary/5"
        )}>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className={cn("w-4 h-4", accent && "text-primary", warn && "text-red-500")} />
                <span className="text-xs font-medium uppercase tracking-wide truncate">{label}</span>
            </div>
            <p className={cn(
                "text-2xl font-extrabold tracking-tight tabular-nums",
                accent ? "text-primary" : warn ? "text-red-500" : "text-foreground"
            )}>
                {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
    );
}
