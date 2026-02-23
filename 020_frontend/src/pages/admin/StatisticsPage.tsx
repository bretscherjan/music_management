
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsService, type RepertoireStatsParams } from '@/services/statsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';

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

    const handleDownloadPdf = async () => {
        try {
            const blob = activeTab === 'repertoire'
                ? await statsService.exportRepertoirePdf(getDateParams())
                : await statsService.exportAttendancePdf(getDateParams());

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

    // Colors
    const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    const ATTENDANCE_COLORS = {
        'PRESENT': '#10b981', // Green
        'EXCUSED': '#f59e0b', // Orange
        'UNEXCUSED': '#ef4444' // Red
    };

    const isLoading = activeTab === 'repertoire' ? isLoadingRepertoire : isLoadingAttendance;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statistiken</h1>
                    <p className="text-gray-500">Auswertung von Repertoire und Anwesenheit</p>
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

                    <Button onClick={handleDownloadPdf} className="whitespace-nowrap">
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 w-fit">
                <button
                    onClick={() => setActiveTab('repertoire')}
                    className={`w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === 'repertoire'
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white text-slate-600 hover:text-slate-800'
                        }`}
                >
                    Repertoire
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === 'attendance'
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white text-slate-600 hover:text-slate-800'
                        }`}
                >
                    Anwesenheit
                </button>
            </div>

            {isLoading && <div className="p-8 text-center text-gray-500">Laden...</div>}

            {!isLoading && activeTab === 'repertoire' && (
                <div className="space-y-6 animate-in fade-in duration-500">
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
                                        <Bar dataKey="rehearsal" stackId="a" fill="#3b82f6" name="Proben" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="performance" stackId="a" fill="#10b981" name="Auftritte" radius={[0, 4, 4, 0]} />
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
                                            fill="#8884d8"
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
                    <Card>
                        <CardContent className="p-0">
                            <ZoomableTableWrapper title="Detailliste: Repertoire">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="h-12 px-4 text-left font-medium text-slate-500">Titel</th>
                                            <th className="h-12 px-4 text-left font-medium text-slate-500">Komponist</th>
                                            <th className="h-12 px-4 text-right font-medium text-slate-500">Proben</th>
                                            <th className="h-12 px-4 text-right font-medium text-slate-500">Auftritte</th>
                                            <th className="h-12 px-4 text-right font-medium text-slate-500">Gesamt</th>
                                            <th className="h-12 px-4 text-right font-medium text-slate-500">Zuletzt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repertoireStats?.slice(0, 50).map((item) => (
                                            <tr key={item.id} className="border-b transition-colors hover:bg-slate-50/50">
                                                <td className="p-4 font-medium">{item.title}</td>
                                                <td className="p-4 text-slate-500">{item.composer || '-'}</td>
                                                <td className="p-4 text-right">{item.rehearsalCount}</td>
                                                <td className="p-4 text-right">{item.performanceCount}</td>
                                                <td className="p-4 text-right font-bold">{item.playCount}</td>
                                                <td className="p-4 text-right text-slate-500">
                                                    {item.lastPlayed ? new Date(item.lastPlayed).toLocaleDateString('de-CH') : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ZoomableTableWrapper>
                            {repertoireStats && repertoireStats.length > 50 && (
                                <div className="text-center p-4 text-xs text-slate-400">
                                    Zeige die ersten 50 von {repertoireStats.length} Einträgen. Nutzen Sie den PDF Export für die volle Liste.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {!isLoading && activeTab === 'attendance' && (
                <div className="space-y-6 animate-in fade-in duration-500">
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
                                    <div className="h-full flex items-center justify-center text-gray-400">
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
                                            <Bar dataKey="count" fill="#10b981" name="Anwesenheiten" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        Keine Daten verfügbar
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* NEW: Full Attendance Table */}
                    <Card>
                        <CardContent className="p-0">
                            <ZoomableTableWrapper title="Detailliste: Anwesenheit">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#2B75A0] text-white">
                                        <tr>
                                            <th className="h-10 px-4 text-left font-bold">Name</th>
                                            <th className="h-10 px-4 text-left font-bold">Register</th>
                                            <th className="h-10 px-4 text-left font-bold">Rate</th>
                                            <th className="h-10 px-4 text-right font-bold">Anwesend</th>
                                            <th className="h-10 px-4 text-right font-bold">Entschuldigt</th>
                                            <th className="h-10 px-4 text-right font-bold">Unentschuldigt</th>
                                            <th className="h-10 px-4 text-right font-bold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceStats?.attendees?.map((item, index) => (
                                            <tr key={item.id} className={`transition-colors border-b ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}>
                                                <td className="p-3 font-medium flex items-center gap-3">
                                                    {item.name}
                                                </td>
                                                <td className="p-3 text-slate-700">{item.register || '-'}</td>
                                                <td className="p-3 font-medium">{item.rate}%</td>
                                                <td className="p-3 text-right">{item.present}</td>
                                                <td className="p-3 text-right">{item.excused}</td>
                                                <td className="p-3 text-right">{item.unexcused}</td>
                                                <td className="p-3 text-right font-bold text-slate-900">{item.total}</td>
                                            </tr>
                                        ))}
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
