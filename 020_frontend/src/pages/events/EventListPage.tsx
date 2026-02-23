import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { useIsAdmin } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, Plus, Filter, Users, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
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

export function EventListPage() {
    const isAdmin = useIsAdmin();
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');

    const { data: events, isLoading, error } = useQuery({
        queryKey: ['events', { category: selectedCategory }],
        queryFn: () => eventService.getAll(
            selectedCategory !== 'all' ? { category: selectedCategory } : undefined
        ),
    });


    const filteredEvents = events?.filter(event => {
        if (selectedCategory === 'all') return true;
        return event.category === selectedCategory;
    }) || [];

    // Sort by date
    const sortedEvents = [...filteredEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by upcoming vs past
    const now = new Date();
    const upcomingEvents = sortedEvents.filter(e => new Date(e.date) >= now);
    const pastEvents = sortedEvents.filter(e => new Date(e.date) < now).reverse();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary">Termine</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Übersicht aller Veranstaltungen und Proben
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <CalendarExportDialog events={filteredEvents} />

                    {isAdmin && (
                        <Link to="/member/admin/events/new">
                            <Button className="shadow-sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Neuer Termin
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {categories.map((cat) => (
                    <Button
                        key={cat.value}
                        variant={selectedCategory === cat.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.value)}
                        className="flex-shrink-0"
                    >
                        {cat.label}
                    </Button>
                ))}
            </div>

            {/* Events List */}
            {
                isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <Card>
                        <CardContent className="p-6 text-center text-destructive">
                            Fehler beim Laden der Termine
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {/* Upcoming Events */}
                        {upcomingEvents.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold mb-4">Kommende Termine</h2>
                                <div className="space-y-3">
                                    {upcomingEvents.map((event) => (
                                        <EventListItem key={event.id} event={event} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Past Events */}
                        {pastEvents.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                                    Vergangene Termine
                                </h2>
                                <div className="space-y-3 opacity-60">
                                    {pastEvents.slice(0, 10).map((event) => (
                                        <EventListItem key={event.id} event={event} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {sortedEvents.length === 0 && (
                            <Card>
                                <CardContent className="p-6 text-center text-muted-foreground">
                                    Keine Termine gefunden
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )
            }
        </div >
    );
}

function EventListItem({ event }: { event: Event }) {
    const categoryVariant: Record<string, 'default' | 'secondary' | 'warning'> = {
        rehearsal: 'secondary',
        performance: 'default',
        other: 'warning',
    };

    const myAttendance = (event as any).attendances?.[0];
    const status = myAttendance?.status;

    const statusBorderColor = {
        yes: 'border-l-green-500',
        no: 'border-l-red-500',
        maybe: 'border-l-yellow-500',
        undefined: 'border-l-transparent'
    };

    const borderColor = status ? statusBorderColor[status as keyof typeof statusBorderColor] : 'border-l-transparent';

    const summary = event.attendanceSummary || { yes: 0, no: 0, maybe: 0, pending: 0, total: 0 };

    return (
        <SwipeableEventCard eventId={event.id} currentStatus={status ?? null}>
            <Link to={`/member/events/${event.id}`}>
                <Card className={`transition-all hover:shadow-md hover:border-primary/50 border-l-4 ${borderColor}`}>
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            {/* Date Badge */}
                            <div className="flex-shrink-0 text-center bg-primary/20 rounded-lg p-2 w-16 flex flex-col items-center justify-center">
                                <div className="text-xs text-secondary/80 uppercase font-semibold">
                                    {new Date(event.date).toLocaleDateString('de-CH', { weekday: 'short' })}
                                </div>
                                <div className="text-xl font-bold text-secondary">
                                    {new Date(event.date).getDate()}
                                </div>
                                <div className="text-xs text-secondary/80">
                                    {new Date(event.date).toLocaleDateString('de-CH', { month: 'short' })}
                                </div>
                            </div>

                            {/* Event Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h3 className="font-semibold truncate">{event.title}</h3>
                                    <Badge variant={categoryVariant[event.category]} className="flex-shrink-0">
                                        {getCategoryLabel(event.category)}
                                    </Badge>
                                    {status && (
                                        <Badge variant="outline" className={`ml-auto ${status === 'yes' ? 'text-green-600 border-green-200 bg-green-50' : status === 'no' ? 'text-red-600 border-red-200 bg-red-50' : 'text-yellow-600 border-yellow-200 bg-yellow-50'}`}>
                                            {status === 'yes' ? 'Zugesagt' : status === 'no' ? 'Abgesagt' : 'Vielleicht'}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                    </span>
                                    {event.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {event.location}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between flex-wrap gap-4 pt-3 border-t">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        Anwesenheit
                                    </div>

                                    {/* Summary Badges */}
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="success" className="gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            {summary.yes}
                                        </Badge>
                                        <Badge variant="destructive" className="gap-1">
                                            <XCircle className="h-3 w-3" />
                                            {summary.no}
                                        </Badge>
                                        <Badge variant="warning" className="gap-1">
                                            <HelpCircle className="h-3 w-3" />
                                            {summary.maybe}
                                        </Badge>
                                        <Badge variant="outline" className="gap-1">
                                            <Clock className="h-3 w-3" />
                                            {summary.pending ?? 0}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </SwipeableEventCard>
    );
}

export default EventListPage;
