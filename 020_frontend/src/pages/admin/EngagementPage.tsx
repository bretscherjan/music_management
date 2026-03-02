import { useState, useMemo } from 'react';
import type { JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
    Activity, Zap, UserX, Clock, AlertTriangle, Users, Wifi,
    ChevronUp, ChevronDown, ChevronsUpDown, Shield, User as UserIcon,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    engagementService, type AnalyticsParams, type InactiveUser, type TopUser,
} from '@/services/engagementService';

// ── Constants ──────────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
    LOGIN:                      '#3b82f6',
    FILE_DOWNLOAD:              '#10b981',
    FILE_PREVIEW:               '#06b6d4',
    FILE_ACCESS:                '#10b981', // legacy
    ATTENDANCE_UPDATE:          '#f59e0b',
    MUSIC_FOLDER_OPEN:          '#8b5cf6',
    MUSIC_FOLDER_ZIP_DOWNLOAD:  '#7c3aed',
    SHEET_MUSIC_VIEW:           '#ec4899',
    EVENT_VIEW:                 '#64748b',
};

const ACTION_LABEL: Record<string, string> = {
    LOGIN:                      'Login',
    FILE_DOWNLOAD:              'Datei-Download',
    FILE_PREVIEW:               'Datei-Vorschau',
    FILE_ACCESS:                'Datei-Zugriff (alt)',
    ATTENDANCE_UPDATE:          'Termin-Zusage',
    MUSIC_FOLDER_OPEN:          'Mappe geöffnet',
    MUSIC_FOLDER_ZIP_DOWNLOAD:  'Mappe als ZIP',
    SHEET_MUSIC_VIEW:           'Noten angeschaut',
    EVENT_VIEW:                 'Termin angeschaut',
};

// Fallback color for chart items without a configured color
const defaultColor = '#64748b';

// Palette used for register stacked bars
const REGISTER_PALETTE = [
    '#2563eb', '#f59e0b', '#10b981', '#7c3aed', '#ef4444', '#06b6d4', '#ec4899', '#065f46', '#7c2d12', '#0ea5a4',
];

// ── Small helpers ──────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
    return role === 'admin'
        ? <Badge variant="outline" className="gap-1 text-purple-700 border-purple-300 bg-purple-50"><Shield className="h-3 w-3" />Admin</Badge>
        : <Badge variant="outline" className="gap-1 text-slate-600"><UserIcon className="h-3 w-3" />Mitglied</Badge>;
}

type SortDir = 'asc' | 'desc';
function useSortState<T>(init: keyof T) {
    const [col, setCol] = useState<keyof T>(init);
    const [dir, setDir] = useState<SortDir>('desc');
    const toggle = (c: keyof T) => { if (c === col) setDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCol(c); setDir('desc'); } };
    const icon = (c: keyof T) => c !== col ? <ChevronsUpDown className="h-3 w-3 opacity-40" /> : dir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />;
    return { col, dir, toggle, icon };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function EngagementPage() {
    // ── Global filters ──────────────────────────────────────────────────────
    const [days,       setDays]       = useState('30');
    const [role,       setRole]       = useState<'all' | 'member' | 'admin'>('all');
    const [featureType, setFeatureType] = useState<'all' | 'interaction' | 'visit'>('all');
    const [inactDays,  setInactDays]  = useState('30');
    const [inactRole,  setInactRole]  = useState<'all' | 'member' | 'admin'>('all');
    const [newRegDays, setNewRegDays] = useState('30');
    const [topAction,  setTopAction]  = useState('all');

    const params: AnalyticsParams = { days: Number(days), role };

    // ── Queries ─────────────────────────────────────────────────────────────
    const { data: peakData,     isLoading: loadingPeak }     = useQuery({ queryKey: ['eng-peak',    days, role], queryFn: () => engagementService.getPeakTimes(params) });
    const { data: featureData,  isLoading: loadingFeature }  = useQuery({ queryKey: ['eng-feature', days, role, featureType], queryFn: () => engagementService.getFeatureUsage({ ...params, type: featureType }) });
    const { data: onlineData,   isLoading: loadingOnline }   = useQuery({ queryKey: ['eng-online'],  queryFn: () => engagementService.getOnlineNow(15), refetchInterval: 30_000 });
    const { data: regData,      isLoading: loadingReg }      = useQuery({ queryKey: ['eng-reg',     days], queryFn: () => engagementService.getActivityByRegister({ days: Number(days) }) });
    const { data: topData,      isLoading: loadingTop }      = useQuery({ queryKey: ['eng-top',     days, role, topAction], queryFn: () => engagementService.getTopUsers({ ...params, action: topAction === 'all' ? undefined : topAction, limit: 15 }) });
    const { data: inactiveData, isLoading: loadingInactive } = useQuery({ queryKey: ['eng-inactive', inactDays, inactRole], queryFn: () => engagementService.getInactiveUsers({ days: Number(inactDays), role: inactRole }) });
    const { data: newRegData,   isLoading: loadingNewReg }   = useQuery({ queryKey: ['eng-newreg',   newRegDays], queryFn: () => engagementService.getNewlyRegisteredUsers({ days: Number(newRegDays) }) });

    // ── Derived: feature chart data ─────────────────────────────────────────
    const featureItems = useMemo(() =>
        (featureData ?? []).map(f => ({ ...f, label: ACTION_LABEL[f.action] ?? f.action })),
        [featureData]);

    // ── Derived: register chart actions (for stacked bars) ─────────────────
    const regActions = useMemo(() => {
        const actions = new Set<string>();
        (regData ?? []).forEach(r => Object.keys(r).filter(k => !k.startsWith('_') && k !== 'register').forEach(k => actions.add(k)));
        return [...actions];
    }, [regData]);

    // ── Inactive table sort ─────────────────────────────────────────────────
    const inactSort = useSortState<InactiveUser>('daysInactive');
    const inactiveUsers = useMemo(() => {
        const arr = [...(inactiveData?.users ?? [])];
        arr.sort((a, b) => {
            const av = a[inactSort.col];
            const bv = b[inactSort.col];

            let cmp: number;
            if (inactSort.col === 'lastSeenAt') {
                // null (never seen) sorts as most inactive (oldest)
                const at = av ? new Date(av as string).getTime() : 0;
                const bt = bv ? new Date(bv as string).getTime() : 0;
                cmp = at - bt;
            } else if (inactSort.col === 'daysInactive') {
                // null (never logged in) = most inactive → treat as Infinity
                const an = av === null ? Infinity : Number(av);
                const bn = bv === null ? Infinity : Number(bv);
                cmp = an - bn;
            } else {
                const as_ = (av ?? '') as string;
                const bs_ = (bv ?? '') as string;
                cmp = typeof av === 'string' ? as_.localeCompare(bs_) : Number(av ?? 0) - Number(bv ?? 0);
            }
            return inactSort.dir === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [inactiveData, inactSort.col, inactSort.dir]);

    // ── Top-users sort ──────────────────────────────────────────────────────
    const topSort = useSortState<TopUser>('total');
    const topUsers = useMemo(() => {
        const arr = [...(topData ?? [])];
        arr.sort((a, b) => {
            const av = a[topSort.col] as number ?? 0;
            const bv = b[topSort.col] as number ?? 0;
            return topSort.dir === 'asc' ? av - bv : bv - av;
        });
        return arr;
    }, [topData, topSort.col, topSort.dir]);

    const maxPeakHour    = Math.max(...(peakData?.hours.map(h => h.count)    ?? [0]));
    const maxPeakWeekday = Math.max(...(peakData?.weekdays.map(d => d.count) ?? [0]));

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Activity className="h-8 w-8 text-blue-600" /> Engagement & Aktivität
                </h1>
                <p className="text-gray-500 mt-1">In-House Analytics – DSGVO-konform, direkt aus der Datenbank.</p>
            </div>

            {/* Global filter bar */}
            <div className="flex flex-wrap gap-3 items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sm font-medium text-slate-600">Filter:</span>
                <Select value={days} onValueChange={setDays}>
                    <SelectTrigger className="w-[150px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Letzte 7 Tage</SelectItem>
                        <SelectItem value="30">Letzte 30 Tage</SelectItem>
                        <SelectItem value="90">Letzte 90 Tage</SelectItem>
                        <SelectItem value="365">Letztes Jahr</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={role} onValueChange={v => setRole(v as any)}>
                    <SelectTrigger className="w-[150px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle Rollen</SelectItem>
                        <SelectItem value="member">Nur Mitglieder</SelectItem>
                        <SelectItem value="admin">Nur Admins</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-xs text-slate-400 ml-auto">
                    Gilt für: Peak-Zeiten · Feature-Nutzung · Top-Mitglieder
                </span>
            </div>

            {/* ── Online jetzt ──────────────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-green-500" />
                    <h2 className="text-xl font-semibold">Online jetzt</h2>
                    <span className="text-xs text-slate-400">(Letzte Aktivität ≤ 15 min, Refresh alle 30 s)</span>
                    {!loadingOnline && (
                        <span className="ml-2 inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            {onlineData?.count ?? 0} online
                        </span>
                    )}
                </div>

                <Card>
                    <CardContent className="pt-4">
                        {loadingOnline ? (
                            <div className="text-slate-400 text-sm">Laden…</div>
                        ) : (onlineData?.users.length ?? 0) === 0 ? (
                            <div className="text-slate-400 text-sm py-2">Gerade niemand aktiv.</div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {onlineData?.users.map(u => (
                                    <div key={u.id}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-sm">
                                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                                        <span className="font-medium">{u.lastName} {u.firstName}</span>
                                        {u.register && <span className="text-slate-400 text-xs">· {u.register}</span>}
                                        <RoleBadge role={u.role} />
                                        <span className="text-slate-400 text-xs">
                                            {formatDistanceToNow(new Date(u.lastSeen), { addSuffix: true, locale: de })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* ── Peak-Zeiten ───────────────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-500" />
                    <h2 className="text-xl font-semibold">Peak-Zeiten</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aktivität nach Uhrzeit</CardTitle>
                            <CardDescription>Wann sind Mitglieder am aktivsten?</CardDescription>
                        </CardHeader>
                        <CardContent className="h-60">
                            {loadingPeak
                                ? <Loader />
                                : <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={peakData?.hours ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="hour" tickFormatter={h => `${h}h`} tick={{ fontSize: 10 }} interval={2} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                        <RTooltip formatter={(v?: number) => [v ?? 0, 'Aktionen']} labelFormatter={h => `${h}:00 Uhr`} />
                                        <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Aktionen">
                                            {peakData?.hours.map((h, i) => <Cell key={i} fill={h.count === maxPeakHour && h.count > 0 ? '#1d4ed8' : '#3b82f6'} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Aktivität nach Wochentag</CardTitle>
                            <CardDescription>Welche Tage sind am aktivsten?</CardDescription>
                        </CardHeader>
                        <CardContent className="h-60">
                            {loadingPeak
                                ? <Loader />
                                : <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={peakData?.weekdays ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                        <RTooltip formatter={(v?: number) => [v ?? 0, 'Aktionen']} />
                                        <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Aktionen">
                                            {peakData?.weekdays.map((d, i) => <Cell key={i} fill={d.count === maxPeakWeekday && d.count > 0 ? '#047857' : '#10b981'} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>}
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* ── Feature-Nutzung ───────────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <Zap className="h-5 w-5 text-slate-500" />
                    <h2 className="text-xl font-semibold">Feature-Nutzung</h2>
                    <Select value={featureType} onValueChange={v => setFeatureType(v as any)}>
                        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Aktionen</SelectItem>
                            <SelectItem value="interaction">Nur Interaktionen</SelectItem>
                            <SelectItem value="visit">Nur Seitenbesuche</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Welche Funktionen werden genutzt?</CardTitle>
                        <CardDescription>Anzahl Aufrufe pro Feature im Zeitraum</CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                        {loadingFeature ? <Loader /> : featureItems.length === 0
                            ? <Empty text="Noch keine Daten – nutze einige Features." />
                            : <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={featureItems} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="label" type="category" width={145} tick={{ fontSize: 12 }} />
                                    <RTooltip formatter={(v?: number) => [v ?? 0, 'Nutzungen']} />
                                    <Bar dataKey="count" name="Nutzungen" radius={[0, 4, 4, 0]}
                                        label={{ position: 'right', fontSize: 11, fill: '#64748b' }}>
                                        {featureItems.map((item, i) => <Cell key={i} fill={ACTION_COLORS[item.action] ?? defaultColor} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                    </CardContent>
                </Card>
            </section>

            {/* ── Aktivität nach Register ───────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-slate-500" />
                    <h2 className="text-xl font-semibold">Aktivität nach Register</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Welches Register nutzt die App am meisten?</CardTitle>
                        <CardDescription>Gestapelte Balken pro Aktionstyp</CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                        {loadingReg ? <Loader /> : (regData?.length ?? 0) === 0
                            ? <Empty text="Noch keine Daten." />
                            : <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={regData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="register" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                    <RTooltip />
                                    <Legend />
                                    {regActions.map((action, i) => (
                                        <Bar key={action} dataKey={action} name={ACTION_LABEL[action] ?? action}
                                            stackId="a" fill={REGISTER_PALETTE[i % REGISTER_PALETTE.length]}
                                            radius={i === regActions.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>}
                    </CardContent>
                </Card>
            </section>

            {/* ── Top Mitglieder ────────────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <Activity className="h-5 w-5 text-slate-500" />
                    <h2 className="text-xl font-semibold">Top Mitglieder</h2>
                    <Select value={topAction} onValueChange={setTopAction}>
                        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Aktionen</SelectItem>
                            <SelectItem value="LOGIN">Logins</SelectItem>
                            <SelectItem value="FILE_DOWNLOAD">Datei-Downloads</SelectItem>
                            <SelectItem value="FILE_PREVIEW">Datei-Vorschauen</SelectItem>
                            <SelectItem value="ATTENDANCE_UPDATE">Termin-Zusagen</SelectItem>
                            <SelectItem value="MUSIC_FOLDER_OPEN">Mappen geöffnet</SelectItem>
                            <SelectItem value="SHEET_MUSIC_VIEW">Noten angeschaut</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Card>
                    <CardContent className="p-0">
                        {loadingTop ? (
                            <div className="p-8 text-center text-slate-400">Laden…</div>
                        ) : topUsers.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">Keine Daten im gewählten Zeitraum.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b text-slate-500">
                                        <tr>
                                            <th className="h-10 px-4 text-left">#</th>
                                            <SortTh label="Name"          col="lastName"         sort={topSort} />
                                            <th className="h-10 px-4 text-left">Register</th>
                                            <th className="h-10 px-4 text-left">Rolle</th>
                                            <SortTh label="Gesamt"        col="total"            sort={topSort} right />
                                            <SortTh label="Logins"        col="logins"           sort={topSort} right />
                                            <SortTh label="Downloads"     col="fileDownloads"    sort={topSort} right />
                                            <SortTh label="Zusagen"       col="attendanceUpdates" sort={topSort} right />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topUsers.map((u, i) => (
                                            <tr key={u.id} className={`border-b transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}>
                                                <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{i + 1}</td>
                                                <td className="px-4 py-2.5 font-medium">{u.lastName} {u.firstName}</td>
                                                <td className="px-4 py-2.5 text-slate-500">{u.register ?? '–'}</td>
                                                <td className="px-4 py-2.5"><RoleBadge role={u.role} /></td>
                                                <td className="px-4 py-2.5 text-right font-bold">{u.total}</td>
                                                <td className="px-4 py-2.5 text-right text-blue-600">{u.logins}</td>
                                                <td className="px-4 py-2.5 text-right text-emerald-600">{u.fileDownloads}</td>
                                                <td className="px-4 py-2.5 text-right text-amber-600">{u.attendanceUpdates}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* ── Neu registrierte Mitglieder ───────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <Users className="h-5 w-5 text-slate-500" />
                    <h2 className="text-xl font-semibold">Neu registrierte Mitglieder</h2>
                    <Select value={newRegDays} onValueChange={setNewRegDays}>
                        <SelectTrigger className="w-[165px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Letzte 7 Tage</SelectItem>
                            <SelectItem value="30">Letzte 30 Tage</SelectItem>
                            <SelectItem value="90">Letzte 90 Tage</SelectItem>
                        </SelectContent>
                    </Select>
                    {!loadingNewReg && (newRegData?.count ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
                            <Users className="h-3.5 w-3.5" />
                            {newRegData?.count} neu
                        </span>
                    )}
                </div>

                <Card>
                    <CardContent className="p-0">
                        {loadingNewReg ? (
                            <div className="p-8 text-center text-slate-400">Laden…</div>
                        ) : (newRegData?.users ?? []).length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                Keine neuen Mitglieder in den letzten {newRegDays} Tagen.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b text-slate-500">
                                        <tr>
                                            <th className="h-10 px-4 text-left">Name</th>
                                            <th className="h-10 px-4 text-left">E-Mail</th>
                                            <th className="h-10 px-4 text-left">Register</th>
                                            <th className="h-10 px-4 text-left">Rolle</th>
                                            <th className="h-10 px-4 text-left">Registriert</th>
                                            <th className="h-10 px-4 text-left">Tage</th>
                                            <th className="h-10 px-4 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newRegData?.users.map((u, i) => (
                                            <tr key={u.id}
                                                className={`border-b transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}>
                                                <td className="px-4 py-2.5 font-medium">{u.lastName} {u.firstName}</td>
                                                <td className="px-4 py-2.5 text-slate-500 text-xs">{u.email}</td>
                                                <td className="px-4 py-2.5 text-slate-500">{u.register?.name ?? '–'}</td>
                                                <td className="px-4 py-2.5"><RoleBadge role={u.role} /></td>
                                                <td className="px-4 py-2.5 text-xs">
                                                    {format(new Date(u.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                                                </td>
                                                <td className="px-4 py-2.5 text-center text-xs font-mono">{u.daysSinceCreation}</td>
                                                <td className="px-4 py-2.5">
                                                    {u.isActive
                                                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Aktiv
                                                        </span>
                                                        : <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Inaktiv
                                                        </span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* ── Inaktive Mitglieder ───────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <UserX className="h-5 w-5 text-slate-500" />
                    <h2 className="text-xl font-semibold">Inaktive Mitglieder</h2>
                    <Select value={inactDays} onValueChange={setInactDays}>
                        <SelectTrigger className="w-[165px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="14">Seit 14 Tagen</SelectItem>
                            <SelectItem value="30">Seit 30 Tagen</SelectItem>
                            <SelectItem value="60">Seit 60 Tagen</SelectItem>
                            <SelectItem value="90">Seit 90 Tagen</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={inactRole} onValueChange={v => setInactRole(v as any)}>
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Rollen</SelectItem>
                            <SelectItem value="member">Nur Mitglieder</SelectItem>
                            <SelectItem value="admin">Nur Admins</SelectItem>
                        </SelectContent>
                    </Select>
                    {!loadingInactive && (inactiveData?.users.length ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {inactiveData?.users.length} inaktiv
                        </span>
                    )}
                </div>

                <Card>
                    <CardContent className="p-0">
                        {loadingInactive ? (
                            <div className="p-8 text-center text-slate-400">Laden…</div>
                        ) : inactiveUsers.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                🎉 Alle aktiven Mitglieder haben sich in den letzten {inactDays} Tagen eingeloggt.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b text-slate-500">
                                        <tr>
                                            <SortTh label="Name"           col="lastName"      sort={inactSort} />
                                            <th className="h-10 px-4 text-left">E-Mail</th>
                                            <th className="h-10 px-4 text-left">Register</th>
                                            <th className="h-10 px-4 text-left">Rolle</th>
                                            <SortTh label="Zuletzt aktiv"  col="lastSeenAt"    sort={inactSort} />
                                            <SortTh label="Tage inaktiv"   col="daysInactive"  sort={inactSort} right />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inactiveUsers.map((u, i) => (
                                            <tr key={u.id}
                                                className={`border-b transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-amber-50`}>
                                                <td className="px-4 py-2.5 font-medium">{u.lastName} {u.firstName}</td>
                                                <td className="px-4 py-2.5 text-slate-500 text-xs">{u.email}</td>
                                                <td className="px-4 py-2.5 text-slate-500">{u.register?.name ?? '–'}</td>
                                                <td className="px-4 py-2.5"><RoleBadge role={u.role} /></td>
                                                <td className="px-4 py-2.5">
                                                    {u.lastSeenAt ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-amber-600 text-xs">
                                                                {format(new Date(u.lastSeenAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                                                            </span>
                                                            <span className="text-slate-400 text-xs">
                                                                {formatDistanceToNow(new Date(u.lastSeenAt), { addSuffix: true, locale: de })}
                                                            </span>
                                                        </div>
                                                    ) : <span className="text-red-500 font-medium text-xs">Noch nie eingeloggt</span>}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <InactiveBadge days={u.daysInactive} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Loader() {
    return <div className="h-full flex items-center justify-center text-slate-400 text-sm">Laden…</div>;
}
function Empty({ text }: { text: string }) {
    return <div className="h-full flex items-center justify-center text-slate-400 text-sm">{text}</div>;
}

function InactiveBadge({ days }: { days: number | null }) {
    if (days === null) return <span className="text-xs font-bold text-red-600 bg-red-100 rounded-full px-2 py-0.5">Nie</span>;
    const cls = days > 60 ? 'text-red-600 bg-red-100' : days > 30 ? 'text-orange-600 bg-orange-100' : 'text-amber-600 bg-amber-100';
    return <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${cls}`}>{days} T</span>;
}

function SortTh<T>({ label, col, sort, right }: {
    label: string; col: keyof T; right?: boolean
    sort: { col: keyof T; toggle: (c: keyof T) => void; icon: (c: keyof T) => JSX.Element }
}) {
    return (
        <th
            className={`h-10 px-4 font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}
            onClick={() => sort.toggle(col)}
        >
            <span className={`inline-flex items-center gap-1 ${right ? 'flex-row-reverse' : ''}`}>
                {label} {sort.icon(col)}
            </span>
        </th>
    );
}