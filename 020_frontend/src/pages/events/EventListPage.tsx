import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { useCan } from '@/context/AuthContext';
import { useMarkRead } from '@/context/UnreadContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Plus, HelpCircle, Archive } from 'lucide-react';
import type { Event, EventCategory } from '@/types';
import { CalendarExportDialog } from '@/components/events/CalendarExportDialog';
import { EventListItem } from '@/components/events/EventListItem';
import { PageHeader } from '@/components/common/PageHeader';

const categories: { value: EventCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'rehearsal', label: 'Proben' },
    { value: 'performance', label: 'Auftritte' },
    { value: 'other', label: 'Sonstiges' },
];

function groupByMonth(events: Event[]): Array<{ monthLabel: string; events: Event[] }> {
    const groups = new Map<string, Event[]>();
    for (const event of events) {
        const key = new Date(event.date).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(event);
    }
    return Array.from(groups.entries()).map(([monthLabel, evs]) => ({ monthLabel, events: evs }));
}

export function EventListPage() {
    const can = useCan();
    useMarkRead('EVENTS');
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
        if (selectedCategory === 'all') return true;
        return event.category === selectedCategory;
    }) || [];

    const sortedEvents = [...filteredEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = sortedEvents.filter(e => new Date(e.date) >= today);
    const pastEvents = sortedEvents.filter(e => new Date(e.date) < today).reverse();
    const recentPastEvents = pastEvents.slice(0, 3);
    const upcomingByMonth = groupByMonth(upcomingEvents);

    return (
        <div className="space-y-5">
            {/* Header */}
            <PageHeader
                title="Termine"
                subtitle="Veranstaltungen & Proben"
                Icon={Calendar}
                actions={
                    <div className="flex items-center gap-2">
                        <CalendarExportDialog events={filteredEvents} />
                        {can('events:write') && (
                            <Link to="/member/admin/events/new">
                                <Button className="h-11 w-11 sm:w-auto sm:px-5 gap-1.5 rounded-2xl shadow-sm">
                                    <Plus className="h-5 w-5 flex-shrink-0" />
                                    <span className="hidden sm:inline">Neuer Termin</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                }
            />

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
                    {/* Upcoming events grouped by month */}
                    {upcomingByMonth.map(({ monthLabel, events: monthEvents }) => (
                        <section key={monthLabel} className="space-y-2">
                            <p className="native-section-label">{monthLabel}</p>
                            <div className="native-group divide-y divide-border/40">
                                {monthEvents.map((event) => (
                                    <EventListItem key={event.id} event={event} isLocked={false} />
                                ))}
                            </div>
                        </section>
                    ))}

                    {/* Last 3 past events + archive link */}
                    {recentPastEvents.length > 0 && (
                        <section className="space-y-2">
                            <Link to="/member/events/archiv">
                                <div className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:underline">
                                    <Archive className="h-4 w-4" />
                                    Archiv – alle {pastEvents.length} vergangenen Termine
                                </div>
                            </Link>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
