import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { useCan } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MapPin, Clock, Plus, CheckCircle, XCircle, HelpCircle, ChevronRight } from 'lucide-react';
import { formatTime, getCategoryLabel } from '@/lib/utils';
import type { Event, EventCategory } from '@/types';
import { CalendarExportDialog } from '@/components/events/CalendarExportDialog';
import { SwipeableEventCard } from '@/components/events/SwipeableEventCard';

const categories: { value: EventCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'rehearsal', label: 'Proben' },
    { value: 'performance', label: 'Auftritte' },
    { value: 'other', label: 'Sonstiges' },
];

const categoryVariant: Record<string, 'default' | 'secondary' | 'warning'> = {
    rehearsal: 'secondary',
    performance: 'default',
    other: 'warning',
};

export function EventListPage() {
    const can = useCan();
    const [searchParams] = useSearchParams();
    const eventIdParam = searchParams.get('id');
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');

    const { data: events, isLoading, error } = useQuery({
        queryKey: ['events', { category: selectedCategory }],
        queryFn: () => eventService.getAll(
            selectedCategory !== 'all' ? { category: selectedCategory } : undefined
        ),
    });

    useEffect(() => {
        if (eventIdParam && events) {
            // Give it a small timeout to ensure DOM is rendered
            const timer = setTimeout(() => {
                const element = document.getElementById(`event-${eventIdParam}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all');
                    setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                    }, 5000);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [eventIdParam, events]);

    const filteredEvents = events?.filter(event => {
        // If we have an ID param, we might want to show that event regardless of category
        // or just highlight it if it's in the list. For now, let's just highlight.
        if (selectedCategory === 'all') return true;
        return event.category === selectedCategory;
    }) || [];

    // Sort by date
    const sortedEvents = [...filteredEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by upcoming vs past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = sortedEvents.filter(e => new Date(e.date) >= today);
    const pastEvents = sortedEvents.filter(e => new Date(e.date) < today).reverse();

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 pt-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Termine</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Veranstaltungen &amp; Proben</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <CalendarExportDialog events={filteredEvents} />
                    {can('events:write') && (
                        <Link to="/member/admin/events/new">
                            <Button size="sm" className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Neuer Termin</span>
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Category Filter – Segmented Control */}
            <div className="overflow-x-auto">
                <div className="segmented-control">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            className={cn('segmented-control-option', selectedCategory === cat.value && 'is-active')}
                            onClick={() => setSelectedCategory(cat.value)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Events List */}
            {isLoading ? (
                <div className="native-group divide-y divide-border/50">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4">
                            <Skeleton className="h-14 w-12 rounded-xl flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="native-group p-8 text-center">
                    <HelpCircle className="h-10 w-10 text-destructive mx-auto mb-3 opacity-50" />
                    <p className="text-destructive font-medium text-sm">Fehler beim Laden der Termine</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                        Erneut versuchen
                    </Button>
                </div>
            ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
                <div className="native-group p-10 text-center">
                    <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-sm text-muted-foreground">Keine Termine in dieser Kategorie</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {upcomingEvents.length > 0 && (
                        <section className="space-y-2">
                            <p className="native-section-label">Anstehende Termine</p>
                            <div className="native-group divide-y divide-border/40">
                                {upcomingEvents.map((event) => (
                                    <EventListItem key={event.id} event={event} isLocked={false} />
                                ))}
                            </div>
                        </section>
                    )}
                    {pastEvents.length > 0 && (
                        <section className="space-y-2 ">
                            <p className="native-section-label">Vergangene Termine</p>
                            <div className="native-group divide-y divide-border/40">
                                {pastEvents.map((event) => (
                                    <EventListItem key={event.id} event={event} isLocked={true} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

function EventListItem({ event, isLocked }: { event: Event; isLocked: boolean }) {
    const status = event.attendances?.[0]?.status ?? null;
    const statusBorderColor = {
        yes: 'border-l-green-500',
        no: 'border-l-red-500',
        maybe: 'border-l-yellow-500',
    };

    const borderColor = status
        ? statusBorderColor[status as keyof typeof statusBorderColor]
        : 'border-l-transparent';

    const summary = event.attendanceSummary || { yes: 0, no: 0, maybe: 0, pending: 0, total: 0 };

    return (
        <div id={`event-${event.id}`} className="scroll-mt-24">
            <SwipeableEventCard eventId={event.id} currentStatus={status} isLocked={isLocked}>
                <Link to={`/member/events/${event.id}`}>
                    <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors border-l-4 ${borderColor}`}>
                        {/* Date Badge */}
                        <div className={cn(
                            "flex-shrink-0 text-center rounded-xl w-12 h-14 flex flex-col items-center justify-center",
                            isLocked ? "bg-muted" : "bg-primary/15"
                        )}>
                            <div className="text-[10px] font-semibold uppercase text-muted-foreground leading-none">
                                {new Date(event.date).toLocaleDateString('de-CH', { weekday: 'short' })}
                            </div>
                            <div className={cn("text-xl font-bold leading-tight", isLocked ? "text-muted-foreground" : "text-primary")}>
                                {new Date(event.date).getDate()}
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-none">
                                {new Date(event.date).toLocaleDateString('de-CH', { month: 'short' })}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-sm truncate">{event.title}</span>
                                <Badge variant={categoryVariant[event.category] ?? 'secondary'} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                    {getCategoryLabel(event.category)}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(event.startTime)}
                                </span>
                                {event.location && (
                                    <span className="flex items-center gap-1 truncate">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                    </span>
                                )}
                            </div>
                            {/* Attendance mini-summary */}
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[11px] text-green-600 font-medium flex items-center gap-0.5">
                                    <CheckCircle className="h-3 w-3" />{summary.yes}
                                </span>
                                <span className="text-[11px] text-red-500 font-medium flex items-center gap-0.5">
                                    <XCircle className="h-3 w-3" />{summary.no}
                                </span>
                                <span className="text-[11px] text-yellow-600 font-medium flex items-center gap-0.5">
                                    <HelpCircle className="h-3 w-3" />{summary.maybe}
                                </span>
                                {status && (
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] px-1.5 py-0 ml-auto flex-shrink-0",
                                        status === 'yes' ? 'text-green-600 border-green-200' :
                                        status === 'no' ? 'text-red-600 border-red-200' :
                                        'text-yellow-600 border-yellow-200'
                                    )}>
                                        {status === 'yes' ? 'Zugesagt' : status === 'no' ? 'Abgesagt' : 'Vielleicht'}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Chevron affordance */}
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    </div>
                </Link>
            </SwipeableEventCard>
        </div>
    );
}
