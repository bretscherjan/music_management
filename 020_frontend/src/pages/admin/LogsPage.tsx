import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, XCircle, Activity, RefreshCw, Wifi } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logsService, { type LogEntry } from '@/services/logsService';
import socketService from '@/services/socketService';

// ── Helpers ────────────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
    INFO:  { color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Info      className="h-3 w-3" />, dot: 'bg-blue-500'  },
    WARN:  { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle className="h-3 w-3" />, dot: 'bg-amber-500' },
    ERROR: { color: 'bg-red-100 text-red-700 border-red-200',       icon: <XCircle   className="h-3 w-3" />, dot: 'bg-red-500'   },
} as const;

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
    const [liveEntries, setLiveEntries] = useState<LogEntry[]>([]);
    const [liveCount,   setLiveCount]   = useState(0);
    const isLiveRef = useRef(true);

    // ── Initial load via API ───────────────────────────────────────────────
    const { data: initialData, isLoading, refetch } = useQuery({
        queryKey: ['logs', levelFilter],
        queryFn:  () => logsService.getLogs(100, levelFilter === 'all' ? undefined : levelFilter),
        staleTime: 10_000,
    });

    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ['logs-stats'],
        queryFn:  logsService.getStats,
        staleTime: 10_000,
    });

    // Merge API entries + live WebSocket entries
    const allEntries = useCallback((): LogEntry[] => {
        const base = initialData?.entries ?? [];
        const merged = [...liveEntries, ...base];
        // deduplicate by id
        const seen = new Set<string>();
        const deduped = merged.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        });
        // apply level filter
        const filtered = levelFilter === 'all' ? deduped : deduped.filter(e => e.level === levelFilter);
        return filtered.slice(0, 100);
    }, [initialData, liveEntries, levelFilter]);

    // ── WebSocket live feed ────────────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token && !socketService.isConnected()) {
            socketService.connect(token).catch(() => {});
        }

        const unsub = socketService.on<LogEntry>('log:entry', (entry) => {
            if (!isLiveRef.current) return;
            setLiveEntries(prev => [entry, ...prev].slice(0, 150));
            setLiveCount(c => c + 1);
        });

        return () => unsub();
    }, []);

    // ── Auto-refresh stats every 30 s ─────────────────────────────────────
    useEffect(() => {
        const id = setInterval(() => { refetchStats(); }, 30_000);
        return () => clearInterval(id);
    }, [refetchStats]);

    const entries = allEntries();

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-8 w-8 text-blue-600" /> System-Logs
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Live-Feed · täglich rotiert · 30 Tage DSGVO-konform aufbewahrt</p>
                </div>
                <div className="flex items-center gap-2">
                    {liveCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2.5 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            {liveCount} live
                        </span>
                    )}
                    <button
                        onClick={() => { refetch(); refetchStats(); setLiveCount(0); }}
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

            {/* Filter + Live indicator */}
            <div className="flex flex-wrap items-center gap-3">
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-slate-500">Live via WebSocket</span>
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
                <span className="text-xs text-slate-400 ml-auto">{entries.length} Einträge angezeigt</span>
            </div>

            {/* Log table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Einträge</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400">Laden…</div>
                    ) : entries.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            Noch keine Log-Einträge im Buffer.<br />
                            <span className="text-xs">Der Buffer füllt sich sobald Aktionen stattfinden.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b text-slate-500">
                                    <tr>
                                        <th className="h-9 px-4 text-left font-medium w-40">Zeitstempel</th>
                                        <th className="h-9 px-3 text-left font-medium w-24">Level</th>
                                        <th className="h-9 px-3 text-left font-medium w-40">Akteur</th>
                                        <th className="h-9 px-3 text-left font-medium w-48">Aktion</th>
                                        <th className="h-9 px-3 text-left font-medium">Info</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((e, i) => (
                                        <tr
                                            key={e.id}
                                            className={`border-b transition-colors ${
                                                e.level === 'ERROR' ? 'bg-red-50/60 hover:bg-red-100/60' :
                                                e.level === 'WARN'  ? 'bg-amber-50/40 hover:bg-amber-100/40' :
                                                i % 2 === 0 ? 'bg-white hover:bg-blue-50/40' : 'bg-slate-50/60 hover:bg-blue-50/40'
                                            }`}
                                        >
                                            <td className="px-4 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                {e.timestamp}
                                            </td>
                                            <td className="px-3 py-2">
                                                <LevelBadge level={e.level} />
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-slate-600 whitespace-nowrap">
                                                {e.actor}
                                            </td>
                                            <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">
                                                {e.action}
                                            </td>
                                            <td className="px-3 py-2 text-slate-500 text-xs max-w-xs truncate" title={e.info}>
                                                {e.info}
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
