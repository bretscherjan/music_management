import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, XCircle, Activity, RefreshCw, Wifi, WifiOff, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logsService, { type LogEntry } from '@/services/logsService';
import socketService from '@/services/socketService';
import { storage } from '@/lib/storage';

// ── Helpers ────────────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
    INFO:  { color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Info      className="h-3 w-3" />, dot: 'bg-blue-500'  },
    WARN:  { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle className="h-3 w-3" />, dot: 'bg-amber-500' },
    ERROR: { color: 'bg-red-100 text-red-700 border-red-200',       icon: <XCircle   className="h-3 w-3" />, dot: 'bg-red-500'   },
} as const;

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function LevelBadge({ level }: { level: LogEntry['level'] }) {
    const cfg = LEVEL_CONFIG[level];
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${cfg.color}`}>
            {cfg.icon} {level}
        </span>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={`rounded-xl border px-5 py-3 flex flex-col gap-1 ${color}`}>
            <span className="text-2xl font-bold tabular-nums">{value}</span>
            <span className="text-xs font-medium opacity-70">{label}</span>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function LogsPage() {
    const [levelFilter, setLevelFilter] = useState('all');
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [liveEntries, setLiveEntries] = useState<LogEntry[]>([]);
    const [liveCount,   setLiveCount]   = useState(0);
    const [zoom,        setZoom]        = useState(100); // percent

    const isToday = selectedDate === todayISO();
    const isLiveRef = useRef(isToday);

    // ── Live buffer (today / no date filter) ──────────────────────────────
    const { data: initialData, isLoading: isLoadingBuffer, refetch } = useQuery({
        queryKey: ['logs', levelFilter],
        queryFn:  () => logsService.getLogs(200, levelFilter === 'all' ? undefined : levelFilter),
        staleTime: 10_000,
        enabled: isToday,
    });

    // ── Historical date-based fetch ────────────────────────────────────────
    const { data: dateData, isLoading: isLoadingDate, refetch: refetchDate } = useQuery({
        queryKey: ['logs-date', selectedDate, levelFilter],
        queryFn:  () => logsService.getLogsByDate(selectedDate, levelFilter === 'all' ? undefined : levelFilter),
        staleTime: 30_000,
        enabled: !isToday,
    });

    // ── Stats ──────────────────────────────────────────────────────────────
    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ['logs-stats'],
        queryFn:  logsService.getStats,
        staleTime: 10_000,
    });

    // Compute displayed entries
    const entries = useCallback((): LogEntry[] => {
        if (!isToday) {
            const base = dateData?.entries ?? [];
            return base; // already filtered + limited by backend
        }
        const base = initialData?.entries ?? [];
        const merged = [...liveEntries, ...base];
        const seen = new Set<string>();
        const deduped = merged.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        });
        const filtered = levelFilter === 'all' ? deduped : deduped.filter(e => e.level === levelFilter);
        return filtered.slice(0, 200);
    }, [isToday, initialData, dateData, liveEntries, levelFilter]);

    // ── WebSocket live feed (only for today) ──────────────────────────────
    useEffect(() => {
        isLiveRef.current = isToday;
    }, [isToday]);

    useEffect(() => {
        const token = storage.getItem('accessToken');
        if (token && !socketService.isConnected()) {
            socketService.connect(token).catch(() => {});
        }

        const unsub = socketService.on<LogEntry>('log:entry', (entry) => {
            if (!isLiveRef.current) return;
            setLiveEntries(prev => [entry, ...prev].slice(0, 200));
            setLiveCount(c => c + 1);
        });

        return () => unsub();
    }, []);

    // ── Auto-refresh stats every 30 s ─────────────────────────────────────
    useEffect(() => {
        const id = setInterval(() => { refetchStats(); }, 30_000);
        return () => clearInterval(id);
    }, [refetchStats]);

    // Clear live entries when switching dates
    useEffect(() => {
        setLiveEntries([]);
        setLiveCount(0);
    }, [selectedDate]);

    const displayedEntries = entries();
    const isLoading = isToday ? isLoadingBuffer : isLoadingDate;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-8 w-8 text-blue-600" /> System-Logs
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Täglich rotiert · 30 Tage DSGVO-konform aufbewahrt</p>
                </div>
                <div className="flex items-center gap-2">
                    {isToday && liveCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2.5 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            {liveCount} live
                        </span>
                    )}
                    <button
                        onClick={() => { refetch(); refetchDate(); refetchStats(); setLiveCount(0); }}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Aktualisieren
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Gesamt (Buffer)"  value={stats?.total ?? 0} color="bg-slate-50 border-slate-200 text-slate-700" />
                <StatCard label="INFO"             value={stats?.INFO  ?? 0} color="bg-blue-50 border-blue-200 text-blue-700" />
                <StatCard label="WARN"             value={stats?.WARN  ?? 0} color="bg-amber-50 border-amber-200 text-amber-700" />
                <StatCard label="ERROR"            value={stats?.ERROR ?? 0} color="bg-red-50 border-red-200 text-red-700" />
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Date picker */}
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <input
                        type="date"
                        value={selectedDate}
                        max={todayISO()}
                        onChange={e => setSelectedDate(e.target.value || todayISO())}
                        className="text-sm border rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isToday ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <Wifi className="h-3.5 w-3.5" /> Live
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <WifiOff className="h-3.5 w-3.5" /> Archiv
                        </span>
                    )}
                </div>

                {/* Level filter */}
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[160px] bg-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle Level</SelectItem>
                        <SelectItem value="INFO">INFO</SelectItem>
                        <SelectItem value="WARN">WARN</SelectItem>
                        <SelectItem value="ERROR">ERROR</SelectItem>
                    </SelectContent>
                </Select>

                <span className="text-xs text-slate-400 ml-auto">{displayedEntries.length} Einträge</span>

                {/* Zoom controls */}
                <div className="flex items-center gap-1 border rounded-lg overflow-hidden bg-white">
                    <button
                        onClick={() => setZoom(z => Math.max(60, z - 10))}
                        className="px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors font-mono leading-none"
                        title="Verkleinern"
                    >−</button>
                    <span className="px-2 text-xs text-slate-500 tabular-nums select-none">{zoom}%</span>
                    <button
                        onClick={() => setZoom(z => Math.min(150, z + 10))}
                        className="px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors font-mono leading-none"
                        title="Vergrößern"
                    >+</button>
                </div>
            </div>

            {/* Log table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        Einträge {!isToday && <span className="text-slate-400 font-normal text-sm ml-2">— {selectedDate}</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400">Laden…</div>
                    ) : displayedEntries.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            {isToday
                                ? <>Noch keine Log-Einträge im Buffer.<br /><span className="text-xs">Der Buffer füllt sich sobald Aktionen stattfinden.</span></>
                                : <>Keine Log-Einträge für {selectedDate} gefunden.</>
                            }
                        </div>
                    ) : (
                        <div
                            className="overflow-auto max-h-[70vh]"
                            style={{ fontSize: `${zoom}%` }}
                        >
                            <table className="w-max min-w-full text-sm border-collapse">
                                <thead className="bg-slate-50 border-b text-slate-500 sticky top-0 z-10">
                                    <tr>
                                        <th className="h-9 px-4 text-left font-medium whitespace-nowrap">Zeitstempel</th>
                                        <th className="h-9 px-3 text-left font-medium whitespace-nowrap">Level</th>
                                        <th className="h-9 px-3 text-left font-medium whitespace-nowrap">Aktion</th>
                                        <th className="h-9 px-3 text-left font-medium whitespace-nowrap">IP</th>
                                        <th className="h-9 px-3 text-left font-medium whitespace-nowrap">User</th>
                                        <th className="h-9 px-3 text-left font-medium whitespace-nowrap">E-Mail</th>
                                        <th className="h-9 px-3 text-left font-medium whitespace-nowrap min-w-[300px]">Info</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedEntries.map((e, i) => (
                                        <tr
                                            key={e.id}
                                            className={`border-b transition-colors ${
                                                e.level === 'ERROR' ? 'bg-red-50/60 hover:bg-red-100/60' :
                                                e.level === 'WARN'  ? 'bg-amber-50/40 hover:bg-amber-100/40' :
                                                i % 2 === 0 ? 'bg-white hover:bg-blue-50/40' : 'bg-slate-50/60 hover:bg-blue-50/40'
                                            }`}
                                        >
                                            <td className="px-4 py-2 font-mono text-xs text-slate-500 whitespace-nowrap align-top">
                                                {e.timestamp}
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <LevelBadge level={e.level} />
                                            </td>
                                            <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap align-top">
                                                {e.action}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-slate-500 whitespace-nowrap align-top">
                                                {e.ip ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-slate-500 whitespace-nowrap align-top">
                                                {e.userId != null ? `#${e.userId}` : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap align-top">
                                                {e.email ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-slate-500 align-top min-w-[300px]">
                                                <span className="block whitespace-pre-wrap break-words">{e.info}</span>
                                                {e.error && (
                                                    <span className="block text-red-500 text-xs mt-0.5 whitespace-pre-wrap break-words">
                                                        ⚠ {e.error.split('\n')[0]}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
