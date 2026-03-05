import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
    Zap, Clock, Users, Wifi,
    ChevronUp, ChevronDown, ChevronsUpDown, Shield, User as UserIcon, Activity,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    engagementService, type AnalyticsParams,
} from '@/services/engagementService';
import socketService from '@/services/socketService';
import type { OnlineJoinedEvent, OnlineLeftEvent, OnlineListEvent } from '@/services/socketService';

// ── Combined User Type for merged table ────────────────────────────────────────
type CombinedUser = {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    role: string;
    register?: string | null;
    category: 'top' | 'newly-registered' | 'inactive' | 'all';
    // Top user fields
    total?: number;
    logins?: number;
    fileDownloads?: number;
    attendanceUpdates?: number;
    // Newly registered fields
    createdAt?: string;
    daysSinceCreation?: number;
    isActive?: boolean;
    // Inactive user fields
    lastSeenAt?: string | null;
    daysInactive?: number | null;
    // All users fields
    daysSinceLastSeen?: number | null;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
    LOGIN: '#3b82f6',
    FILE_DOWNLOAD: '#10b981',
    FILE_PREVIEW: '#06b6d4',
    FILE_ACCESS: '#10b981', // legacy
    ATTENDANCE_UPDATE: '#f59e0b',
    MUSIC_FOLDER_OPEN: '#8b5cf6',
    MUSIC_FOLDER_ZIP_DOWNLOAD: '#7c3aed',
    SHEET_MUSIC_VIEW: '#ec4899',
    EVENT_VIEW: '#64748b',
};

const ACTION_LABEL: Record<string, string> = {
    LOGIN: 'Login',
    FILE_DOWNLOAD: 'Datei-Download',
    FILE_PREVIEW: 'Datei-Vorschau',
    FILE_ACCESS: 'Datei-Zugriff (alt)',
    ATTENDANCE_UPDATE: 'Termin-Zusage',
    MUSIC_FOLDER_OPEN: 'Mappe geöffnet',
    MUSIC_FOLDER_ZIP_DOWNLOAD: 'Mappe als ZIP',
    SHEET_MUSIC_VIEW: 'Noten angeschaut',
    EVENT_VIEW: 'Termin angeschaut',
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

// ── Page ───────────────────────────────────────────────────────────────────────

export function EngagementPage() {
    // ── Global filters ──────────────────────────────────────────────────────
    const [days, setDays] = useState('30');
    const [role, setRole] = useState<'all' | 'member' | 'admin'>('all');
    const [featureType, setFeatureType] = useState<'all' | 'interaction' | 'visit'>('all');

    // ── Combined users table filters ────────────────────────────────────────
    const [userCategory, setUserCategory] = useState<'all' | 'top' | 'newly-registered' | 'inactive' | 'all-members'>('all');
    const [inactDays, setInactDays] = useState('30');
    const [newRegDays, setNewRegDays] = useState('30');
    const [topAction, setTopAction] = useState('all');

    // ── Real-time online users (via WebSocket) ──────────────────────────────
    const [onlineUsers, setOnlineUsers] = useState<Array<{
        id: number; firstName: string; lastName: string
        role: string; register: string | null; lastSeen: Date
    }>>([]);
    const [loadingOnline, setLoadingOnline] = useState(true);
    // Tracks last-seen time for users who recently went offline (keyed by userId)
    const [recentlyOffline, setRecentlyOffline] = useState<Record<number, Date>>({});

    const queryClient = useQueryClient();
    const params: AnalyticsParams = { days: Number(days), role };

    // ── Queries ─────────────────────────────────────────────────────────────
    const { data: peakData, isLoading: loadingPeak } = useQuery({ queryKey: ['eng-peak', days, role], queryFn: () => engagementService.getPeakTimes(params) });
    const { data: featureData, isLoading: loadingFeature } = useQuery({ queryKey: ['eng-feature', days, role, featureType], queryFn: () => engagementService.getFeatureUsage({ ...params, type: featureType }) });
    const { data: regData, isLoading: loadingReg } = useQuery({ queryKey: ['eng-reg', days], queryFn: () => engagementService.getActivityByRegister({ days: Number(days) }) });
    const { data: topData, isLoading: loadingTop } = useQuery({ queryKey: ['eng-top', days, role, topAction], queryFn: () => engagementService.getTopUsers({ ...params, action: topAction === 'all' ? undefined : topAction, limit: 100 }) });
    const { data: inactiveData, isLoading: loadingInactive } = useQuery({ queryKey: ['eng-inactive', inactDays], queryFn: () => engagementService.getInactiveUsers({ days: Number(inactDays), role: 'all' }) });
    const { data: newRegData, isLoading: loadingNewReg } = useQuery({ queryKey: ['eng-newreg', newRegDays], queryFn: () => engagementService.getNewlyRegisteredUsers({ days: Number(newRegDays) }) });
    const { data: allUsersData, isLoading: loadingAllUsers } = useQuery({ queryKey: ['eng-all-users', days, role], queryFn: () => engagementService.getAllUsersWithEngagement(params), staleTime: 0 });

    // ── Initialize online data from API fallback & set up WebSocket listeners ──
    useEffect(() => {
        // Subscribe synchronously so cleanup always runs
        const unsubJoined = socketService.on<OnlineJoinedEvent>('online:joined', (user) => {
            // Remove from recently-offline when user comes back
            setRecentlyOffline(prev => { const next = { ...prev }; delete next[user.userId]; return next; });
            setOnlineUsers(prev => {
                if (prev.some(u => u.id === user.userId)) return prev;
                return [
                    ...prev,
                    {
                        id: user.userId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        register: user.register,
                        lastSeen: new Date(),
                    }
                ];
            });
        });

        const unsubLeft = socketService.on<OnlineLeftEvent>('online:left', (data) => {
            // Record the moment they went offline as their last-seen time
            setRecentlyOffline(prev => ({ ...prev, [data.userId]: new Date() }));
            setOnlineUsers(prev => prev.filter(u => u.id !== data.userId));
            // Invalidate allUsersData after a short delay so the DB write (lastSeenAt)
            // from the disconnect handler has time to complete before we re-fetch.
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['eng-all-users'] });
            }, 1500);
        });

        // online:list replaces the full list (initial load or on-demand refresh)
        const unsubList = socketService.on<OnlineListEvent>('online:list', (data) => {
            setOnlineUsers(data.users.map(u => ({
                id: u.userId,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                register: u.register,
                lastSeen: new Date(u.lastSeen),
            })));
            setLoadingOnline(false);
        });

        const initializeOnlineTracking = async () => {
            try {
                if (socketService.isConnected()) {
                    // Socket already connected via AuthContext – just request the current list
                    socketService.requestOnlineList();
                } else {
                    // Fallback: connect first (e.g., during dev hot-reload) then request list
                    const token = localStorage.getItem('accessToken');
                    if (token) {
                        await socketService.connect(token);
                        socketService.requestOnlineList();
                    } else {
                        // Last resort: fetch from REST API
                        const initialData = await engagementService.getOnlineNow(15);
                        setOnlineUsers(initialData.users.map(u => ({
                            ...u,
                            lastSeen: new Date(u.lastSeen),
                        })));
                        setLoadingOnline(false);
                    }
                }
            } catch (error) {
                console.error('Failed to initialize online tracking:', error);
                setLoadingOnline(false);
            }
        };

        initializeOnlineTracking();

        return () => {
            unsubJoined();
            unsubLeft();
            unsubList();
        };
    }, []);

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

    const maxPeakHour = Math.max(...(peakData?.hours.map(h => h.count) ?? [0]));
    const maxPeakWeekday = Math.max(...(peakData?.weekdays.map(d => d.count) ?? [0]));

    // ── Merged Users (combine top, new, inactive) ──────────────────────────
    const combinedUsers: CombinedUser[] = useMemo(() => {
        // Build a lookup map from allUsersData so every user in the combined table
        // can get a lastSeenAt, even if their primary endpoint doesn't return it.
        const allUsersMap = new Map(
            (allUsersData?.users ?? []).map(u => [u.id, u])
        );

        const merged: CombinedUser[] = [];

        // Add top users
        (topData ?? []).forEach(u => {
            merged.push({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                register: u.register,
                category: 'top',
                total: u.total,
                logins: u.logins,
                fileDownloads: u.fileDownloads,
                attendanceUpdates: u.attendanceUpdates,
                lastSeenAt: allUsersMap.get(u.id)?.lastSeenAt ?? null,
            });
        });

        // Add newly registered users
        (newRegData?.users ?? []).forEach(u => {
            if (!merged.find(m => m.id === u.id)) {
                merged.push({
                    id: u.id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                    role: u.role,
                    register: u.register?.name,
                    category: 'newly-registered',
                    createdAt: u.createdAt,
                    daysSinceCreation: u.daysSinceCreation,
                    isActive: u.isActive,
                    lastSeenAt: allUsersMap.get(u.id)?.lastSeenAt ?? null,
                });
            }
        });

        // Add inactive users
        (inactiveData?.users ?? []).forEach(u => {
            if (!merged.find(m => m.id === u.id)) {
                merged.push({
                    id: u.id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                    role: u.role,
                    register: u.register?.name,
                    category: 'inactive',
                    lastSeenAt: u.lastSeenAt,
                    daysInactive: u.daysInactive,
                });
            }
        });

        return merged;
    }, [topData, newRegData, inactiveData, allUsersData]);

    // ── Combined Users Sort State ──────────────────────────────────────────
    type CombinedUserSortCol = 'lastName' | 'firstName' | 'email' | 'register' | 'createdAt' | 'daysSinceCreation' | 'lastSeenAt' | 'daysInactive' | 'total' | 'logins' | 'fileDownloads' | 'attendanceUpdates' | 'daysSinceLastSeen';

    const [combinedSortCol, setCombinedSortCol] = useState<CombinedUserSortCol>('lastName');
    const [combinedSortDir, setCombinedSortDir] = useState<'asc' | 'desc'>('asc');

    const toggleCombinedSort = (col: CombinedUserSortCol) => {
        if (col === combinedSortCol) {
            setCombinedSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setCombinedSortCol(col);
            setCombinedSortDir('desc');
        }
    };

    const getCombinedSortIcon = (col: CombinedUserSortCol) =>
        col !== combinedSortCol ? <ChevronsUpDown className="h-3 w-3 opacity-40" /> : combinedSortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />;

    const sortedCombinedUsers = useMemo(() => {
        const arr = [...combinedUsers];
        if (userCategory !== 'all') {
            arr.splice(0, arr.length, ...(arr.filter(u => u.category === userCategory)));
        }
        arr.sort((a, b) => {
            const av = a[combinedSortCol];
            const bv = b[combinedSortCol];
            let cmp: number;

            if (combinedSortCol === 'lastSeenAt') {
                const at = (av as string | null) ? new Date(av as string).getTime() : 0;
                const bt = (bv as string | null) ? new Date(bv as string).getTime() : 0;
                cmp = at - bt;
            } else if (['daysInactive', 'daysSinceCreation', 'total', 'logins', 'fileDownloads', 'attendanceUpdates'].includes(combinedSortCol)) {
                const an = av === null || av === undefined ? -Infinity : Number(av);
                const bn = bv === null || bv === undefined ? -Infinity : Number(bv);
                cmp = an - bn;
            } else if (combinedSortCol === 'createdAt') {
                const at = av ? new Date(av as string).getTime() : 0;
                const bt = bv ? new Date(bv as string).getTime() : 0;
                cmp = at - bt;
            } else {
                const as_ = (av ?? '') as string;
                const bs_ = (bv ?? '') as string;
                cmp = typeof av === 'string' ? as_.localeCompare(bs_) : Number(av ?? 0) - Number(bv ?? 0);
            }
            return combinedSortDir === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [combinedUsers, userCategory, combinedSortCol, combinedSortDir]);

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
                    <span className="text-xs text-slate-400">(Live via WebSocket – verschwindet bei Tab-Wechsel / Fenster minimieren)</span>
                    {!loadingOnline && (
                        <span className="ml-2 inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            {onlineUsers.length} online
                        </span>
                    )}
                </div>

                <Card>
                    <CardContent className="pt-4">
                        {loadingOnline ? (
                            <div className="text-slate-400 text-sm">Laden…</div>
                        ) : onlineUsers.length === 0 ? (
                            <div className="text-slate-400 text-sm py-2">Gerade niemand aktiv.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[110px]">Status</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Register</TableHead>
                                        <TableHead>Rolle</TableHead>
                                        <TableHead className="text-right">Zuletzt online</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {onlineUsers.map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    Aktiv
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-medium">{u.lastName} {u.firstName}</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{u.register ?? '—'}</TableCell>
                                            <TableCell><RoleBadge role={u.role} /></TableCell>
                                            <TableCell className="text-right text-slate-500 text-sm">
                                                {formatDistanceToNow(u.lastSeen, { addSuffix: true, locale: de })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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

            {/* ── Mitglieder-Übersicht (kombiniert) ───────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <Users className="h-5 w-5 text-slate-500" />
                    <h2 className="text-xl font-semibold">Mitglieder-Übersicht</h2>
                    <Select value={userCategory} onValueChange={v => setUserCategory(v as any)}>
                        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Kategorien</SelectItem>
                            <SelectItem value="all-members">Alle Mitglieder</SelectItem>
                            <SelectItem value="top">Top Mitglieder</SelectItem>
                            <SelectItem value="newly-registered">Neu registriert</SelectItem>
                            <SelectItem value="inactive">Inaktiv</SelectItem>
                        </SelectContent>
                    </Select>

                    {userCategory === 'newly-registered' && (
                        <Select value={newRegDays} onValueChange={setNewRegDays}>
                            <SelectTrigger className="w-[165px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Letzte 7 Tage</SelectItem>
                                <SelectItem value="30">Letzte 30 Tage</SelectItem>
                                <SelectItem value="90">Letzte 90 Tage</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    {userCategory === 'inactive' && (
                        <Select value={inactDays} onValueChange={setInactDays}>
                            <SelectTrigger className="w-[165px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="14">Seit 14 Tagen</SelectItem>
                                <SelectItem value="30">Seit 30 Tagen</SelectItem>
                                <SelectItem value="60">Seit 60 Tagen</SelectItem>
                                <SelectItem value="90">Seit 90 Tagen</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    {userCategory === 'top' && (
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
                    )}
                </div>

                <Card>
                    <CardContent className="p-0">
                        {userCategory === 'all-members' ? (
                            // All Members Table
                            loadingAllUsers ? (
                                <div className="p-8 text-center text-slate-400">Laden…</div>
                            ) : !allUsersData?.users.length ? (
                                <div className="p-8 text-center text-slate-400">
                                    Keine Mitglieder gefunden.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b text-slate-500 sticky top-0">
                                            <tr>
                                                <th className="h-10 px-4 font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('lastName')}>
                                                    <span className="inline-flex items-center gap-1">Name {getCombinedSortIcon('lastName')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-left">E-Mail</th>
                                                <th className="h-10 px-4 text-left">Register</th>
                                                <th className="h-10 px-4 text-left">Rolle</th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('total')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Gesamt {getCombinedSortIcon('total')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('logins')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Logins {getCombinedSortIcon('logins')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('fileDownloads')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Downloads {getCombinedSortIcon('fileDownloads')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('attendanceUpdates')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Anwesenheit {getCombinedSortIcon('attendanceUpdates')}</span>
                                                </th>
                                                <th className="h-10 px-4 font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('lastSeenAt')}>
                                                    <span className="inline-flex items-center gap-1">Zuletzt aktiv {getCombinedSortIcon('lastSeenAt')}</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allUsersData.users
                                                .sort((a, b) => {
                                                    let aVal: any, bVal: any;
                                                    switch (combinedSortCol) {
                                                        case 'lastName': aVal = a.lastName; bVal = b.lastName; break;
                                                        case 'firstName': aVal = a.firstName; bVal = b.firstName; break;
                                                        case 'email': aVal = a.email; bVal = b.email; break;
                                                        case 'register': aVal = a.register; bVal = b.register; break;
                                                        case 'total': aVal = a.total; bVal = b.total; break;
                                                        case 'logins': aVal = a.logins; bVal = b.logins; break;
                                                        case 'fileDownloads': aVal = a.fileDownloads; bVal = b.fileDownloads; break;
                                                        case 'attendanceUpdates': aVal = a.attendanceUpdates; bVal = b.attendanceUpdates; break;
                                                        case 'lastSeenAt': aVal = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : null; bVal = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : null; break;
                                                        case 'daysSinceLastSeen': aVal = a.daysSinceLastSeen; bVal = b.daysSinceLastSeen; break;
                                                        default: return 0;
                                                    }
                                                    if (aVal == null && bVal == null) return 0;
                                                    if (aVal == null) return combinedSortDir === 'asc' ? 1 : -1;
                                                    if (bVal == null) return combinedSortDir === 'asc' ? -1 : 1;
                                                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                                                        return combinedSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                                                    }
                                                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                                                        return combinedSortDir === 'asc' ? aVal - bVal : bVal - aVal;
                                                    }
                                                    return 0;
                                                })
                                                .map((u, i) => (
                                                    <tr key={u.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                                                        <td className="px-4 py-3 font-medium">{u.lastName}, {u.firstName}</td>
                                                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                                                        <td className="px-4 py-3">{u.register || '-'}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                                                                {u.role === 'admin' ? 'Admin' : 'Mitglied'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono">{u.total}</td>
                                                        <td className="px-4 py-3 text-right font-mono">{u.logins}</td>
                                                        <td className="px-4 py-3 text-right font-mono">{u.fileDownloads}</td>
                                                        <td className="px-4 py-3 text-right font-mono">{u.attendanceUpdates}</td>
                                                        <td className="px-4 py-3">
                                                            {(() => {
                                                                const onlineEntry = onlineUsers.find(ou => ou.id === u.id);
                                                                const recentTs = recentlyOffline[u.id];
                                                                if (onlineEntry) {
                                                                    return (
                                                                        <div className="flex flex-col">
                                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5 w-fit">
                                                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                                                                            </span>
                                                                            <span className="text-slate-400 text-xs mt-0.5">
                                                                                {formatDistanceToNow(onlineEntry.lastSeen, { addSuffix: true, locale: de })}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                                const lastSeenDate = recentTs ?? (u.lastSeenAt ? new Date(u.lastSeenAt) : null);
                                                                if (lastSeenDate) {
                                                                    return (
                                                                        <div className="flex flex-col">
                                                                            <span className="text-amber-600 text-xs">
                                                                                {format(lastSeenDate, 'dd.MM.yyyy HH:mm', { locale: de })}
                                                                            </span>
                                                                            <span className="text-slate-400 text-xs">
                                                                                {formatDistanceToNow(lastSeenDate, { addSuffix: true, locale: de })}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return <span className="text-slate-400 text-xs">Nie</span>;
                                                            })()}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : (
                            // Existing Combined Table
                            loadingTop || loadingNewReg || loadingInactive ? (
                                <div className="p-8 text-center text-slate-400">Laden…</div>
                            ) : sortedCombinedUsers.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    Keine Mitglieder in dieser Kategorie.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b text-slate-500 sticky top-0">
                                            <tr>
                                                <th className="h-10 px-4 text-left">Kategorie</th>
                                                <th className="h-10 px-4 font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('lastName')}>
                                                    <span className="inline-flex items-center gap-1">Name {getCombinedSortIcon('lastName')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-left">E-Mail</th>
                                                <th className="h-10 px-4 text-left">Register</th>
                                                <th className="h-10 px-4 text-left">Rolle</th>
                                                <th className="h-10 px-4 font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('createdAt')}>
                                                    <span className="inline-flex items-center gap-1">Registriert {getCombinedSortIcon('createdAt')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('daysSinceCreation')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Tage neu {getCombinedSortIcon('daysSinceCreation')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-left">Status</th>
                                                <th className="h-10 px-4 font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('lastSeenAt')}>
                                                    <span className="inline-flex items-center gap-1">Zuletzt aktiv {getCombinedSortIcon('lastSeenAt')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('daysInactive')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Tage inaktiv {getCombinedSortIcon('daysInactive')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('total')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Gesamt Aktionen {getCombinedSortIcon('total')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('logins')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Logins {getCombinedSortIcon('logins')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('fileDownloads')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Downloads {getCombinedSortIcon('fileDownloads')}</span>
                                                </th>
                                                <th className="h-10 px-4 text-right font-medium cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => toggleCombinedSort('attendanceUpdates')}>
                                                    <span className="inline-flex items-center gap-1 flex-row-reverse">Zusagen {getCombinedSortIcon('attendanceUpdates')}</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedCombinedUsers.map((u, i) => (
                                                <tr key={`${u.id}-${u.category}`} className={`border-b transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}>
                                                    <td className="px-4 py-2.5">
                                                        <Badge variant={u.category === 'top' ? 'default' : u.category === 'newly-registered' ? 'secondary' : 'outline'}>
                                                            {u.category === 'top' ? 'Top' : u.category === 'newly-registered' ? 'Neu' : 'Inaktiv'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-2.5 font-medium">{u.lastName} {u.firstName}</td>
                                                    <td className="px-4 py-2.5 text-slate-500 text-xs">{u.email ?? '–'}</td>
                                                    <td className="px-4 py-2.5 text-slate-500">{u.register ?? '–'}</td>
                                                    <td className="px-4 py-2.5"><RoleBadge role={u.role} /></td>
                                                    <td className="px-4 py-2.5 text-xs">
                                                        {u.createdAt ? format(new Date(u.createdAt), 'dd.MM.yyyy HH:mm', { locale: de }) : '–'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-xs font-mono">{u.daysSinceCreation ?? '–'}</td>
                                                    <td className="px-4 py-2.5">
                                                        {(() => {
                                                            const onlineEntry = onlineUsers.find(ou => ou.id === u.id);
                                                            if (onlineEntry) {
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                                                                    </span>
                                                                );
                                                            }
                                                            if (u.isActive !== undefined) {
                                                                return u.isActive
                                                                    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Aktiv
                                                                    </span>
                                                                    : <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Inaktiv
                                                                    </span>;
                                                            }
                                                            return '–';
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        {(() => {
                                                            const onlineEntry = onlineUsers.find(ou => ou.id === u.id);
                                                            if (onlineEntry) {
                                                                return (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-green-600 text-xs font-medium">Gerade aktiv</span>
                                                                        <span className="text-slate-400 text-xs">
                                                                            {formatDistanceToNow(onlineEntry.lastSeen, { addSuffix: true, locale: de })}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                            const recentTs = recentlyOffline[u.id];
                                                            const lastSeenDate = recentTs ?? (u.lastSeenAt ? new Date(u.lastSeenAt) : null);
                                                            if (lastSeenDate) {
                                                                return (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-amber-600 text-xs">
                                                                            {format(lastSeenDate, 'dd.MM.yyyy HH:mm', { locale: de })}
                                                                        </span>
                                                                        <span className="text-slate-400 text-xs">
                                                                            {formatDistanceToNow(lastSeenDate, { addSuffix: true, locale: de })}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                            return u.category === 'inactive' ? <span className="text-red-500 font-medium text-xs">Noch nie</span> : '–';
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        {u.daysInactive !== undefined ? <InactiveBadge days={u.daysInactive} /> : '–'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-bold">{u.total ?? '–'}</td>
                                                    <td className="px-4 py-2.5 text-right text-blue-600">{u.logins ?? '–'}</td>
                                                    <td className="px-4 py-2.5 text-right text-emerald-600">{u.fileDownloads ?? '–'}</td>
                                                    <td className="px-4 py-2.5 text-right text-amber-600">{u.attendanceUpdates ?? '–'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
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