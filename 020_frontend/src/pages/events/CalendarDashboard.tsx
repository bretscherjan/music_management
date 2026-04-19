import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek,
    endOfWeek, eachDayOfInterval, isSameMonth, format,
    isToday, isPast,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { eventService } from '@/services/eventService';
import { calendarService } from '@/services/calendarService';
import { CalendarExportDialog } from '@/components/events/CalendarExportDialog';
import { DEFAULT_CALENDAR_PREFS } from '@/types';
import type { Event, EventCategory } from '@/types';
import type { CalendarPreferences } from '@/types';
import { cn } from '@/lib/utils';

// ── Color palette per category ────────────────────────────────────────────────
const CATEGORY_COLORS: Record<EventCategory, { chip: string; dot: string; label: string }> = {
    performance: {
        chip: 'bg-primary text-primary-foreground',
        dot: 'bg-primary',
        label: 'Auftritt',
    },
    rehearsal: {
        chip: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        dot: 'bg-slate-400',
        label: 'Probe',
    },
    other: {
        chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        dot: 'bg-amber-400',
        label: 'Sonstiges',
    },
};

// ── Attendance badge ──────────────────────────────────────────────────────────
function AttendanceBadge({ status }: { status: string | null | undefined }) {
    if (!status) return <span className="text-[9px] opacity-50">–</span>;
    const map: Record<string, { label: string; cls: string }> = {
        yes: { label: 'Ja', cls: 'text-green-600 dark:text-green-400' },
        no: { label: 'Nein', cls: 'text-red-500 dark:text-red-400' },
        maybe: { label: '?', cls: 'text-yellow-600 dark:text-yellow-400' },
    };
    const m = map[status];
    if (!m) return null;
    return <span className={cn('text-[9px] font-bold leading-none', m.cls)}>{m.label}</span>;
}

// ── Filter helpers (mirrors backend logic) ────────────────────────────────────
function applyPrefsFilter(events: Event[], prefs: CalendarPreferences): Event[] {
    return events.filter(event => {
        if (prefs.categories.length > 0 && !prefs.categories.includes(event.category)) return false;
        if (prefs.onlyConfirmed) {
            const status = event.attendances?.[0]?.status;
            if (status !== 'yes') return false;
        }
        return true;
    });
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function CalendarDashboard() {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const { data: allEvents, isLoading: eventsLoading } = useQuery({
        queryKey: ['events', { dashboard: true }],
        queryFn: () => eventService.getAll(),
    });

    const { data: prefs = DEFAULT_CALENDAR_PREFS, isLoading: prefsLoading } = useQuery({
        queryKey: ['calendar-prefs'],
        queryFn: () => calendarService.getPreferences(),
    });

    const filteredEvents = useMemo(
        () => applyPrefsFilter(allEvents ?? [], prefs),
        [allEvents, prefs]
    );

    // Build a map: dateKey → events[]
    const eventsByDate = useMemo(() => {
        const map = new Map<string, Event[]>();
        for (const ev of filteredEvents) {
            const key = format(new Date(ev.date), 'yyyy-MM-dd');
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ev);
        }
        return map;
    }, [filteredEvents]);

    // Days grid for current month
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const isLoading = eventsLoading || prefsLoading;

    // Active filter summary for the mirror hint
    const activeFilters: string[] = [];
    if (prefs.onlyConfirmed) activeFilters.push('Nur Zusagen');
    if (prefs.categories.length > 0)
        activeFilters.push(prefs.categories.map(c => CATEGORY_COLORS[c].label).join(', '));
    if (prefs.reminderMinutes > 0) activeFilters.push(`Erinnerung ${prefs.reminderMinutes} Min`);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link to="/member/events">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">Kalendervorschau</h1>
                        <p className="text-sm text-muted-foreground">Sync-Mirror deines persönlichen Kalenders</p>
                    </div>
                </div>
                <CalendarExportDialog events={allEvents ?? []} />
            </div>

            {/* Filter mirror hint */}
            <div className="native-group px-4 py-3 flex items-center gap-2 flex-wrap">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">Aktive Filter:</span>
                {activeFilters.length === 0 ? (
                    <Badge variant="outline" className="text-[11px]">Alle Termine</Badge>
                ) : (
                    activeFilters.map(f => (
                        <Badge key={f} variant="secondary" className="text-[11px]">{f}</Badge>
                    ))
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                    {filteredEvents.length} Termine
                </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-1 flex-wrap">
                {Object.entries(CATEGORY_COLORS).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', val.dot)} />
                        <span className="text-xs text-muted-foreground">{val.label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[10px] font-bold text-green-600">Ja</span>
                    <span className="text-[10px] text-muted-foreground">/</span>
                    <span className="text-[10px] font-bold text-red-500">Nein</span>
                    <span className="text-[10px] text-muted-foreground">/</span>
                    <span className="text-[10px] font-bold text-yellow-600">?</span>
                    <span className="text-xs text-muted-foreground ml-0.5">= Rückmeldung</span>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="native-group overflow-hidden">
                {/* Month navigation */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="text-base font-semibold">
                        {format(currentMonth, 'MMMM yyyy', { locale: de })}
                    </p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-border/40">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                        <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-2">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                {isLoading ? (
                    <div className="grid grid-cols-7 p-2 gap-1">
                        {Array.from({ length: 35 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-7 divide-x divide-y divide-border/20">
                        {days.map(day => {
                            const key = format(day, 'yyyy-MM-dd');
                            const dayEvents = eventsByDate.get(key) ?? [];
                            const inMonth = isSameMonth(day, currentMonth);
                            const today = isToday(day);
                            const past = isPast(day) && !today;

                            return (
                                <div
                                    key={key}
                                    className={cn(
                                        'min-h-[80px] p-1.5 flex flex-col gap-0.5',
                                        !inMonth && 'opacity-30 bg-muted/20',
                                        today && 'bg-primary/5'
                                    )}
                                >
                                    {/* Day number */}
                                    <div className={cn(
                                        'text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full mx-auto leading-none',
                                        today
                                            ? 'bg-primary text-primary-foreground'
                                            : past && inMonth
                                                ? 'text-muted-foreground/50'
                                                : 'text-foreground'
                                    )}>
                                        {format(day, 'd')}
                                    </div>

                                    {/* Event chips */}
                                    {dayEvents.slice(0, 3).map(ev => {
                                        const colors = CATEGORY_COLORS[ev.category];
                                        const status = ev.attendances?.[0]?.status;
                                        return (
                                            <Link key={ev.id} to={`/member/events/${ev.id}`}>
                                                <div className={cn(
                                                    'rounded-[4px] px-1 py-0.5 text-[9px] font-medium leading-tight flex items-center justify-between gap-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity',
                                                    colors.chip
                                                )}>
                                                    <span className="truncate">{ev.title}</span>
                                                    <AttendanceBadge status={status} />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                    {dayEvents.length > 3 && (
                                        <span className="text-[9px] text-muted-foreground pl-0.5">
                                            +{dayEvents.length - 3} mehr
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Upcoming events list (filtered) */}
            {!isLoading && filteredEvents.length > 0 && (
                <div className="space-y-2">
                    <p className="native-section-label">Nächste Termine im Feed</p>
                    <div className="native-group divide-y divide-border/40">
                        {filteredEvents
                            .filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                            .slice(0, 5)
                            .map(ev => {
                                const colors = CATEGORY_COLORS[ev.category];
                                const status = ev.attendances?.[0]?.status;
                                return (
                                    <Link key={ev.id} to={`/member/events/${ev.id}`}>
                                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                                            <span className={cn('h-2 w-2 rounded-full shrink-0', colors.dot)} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{ev.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(ev.date), 'E, d. MMM yyyy', { locale: de })}
                                                    {' · '}{ev.startTime}
                                                </p>
                                            </div>
                                            {status && <AttendanceBadge status={status} />}
                                        </div>
                                    </Link>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}
