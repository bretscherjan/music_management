import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { useCan } from '@/context/AuthContext';
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

                    {can('events:write') && (
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
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardContent className="p-12 text-center">
                            <HelpCircle className="h-12 w-12 text-destructive mx-auto mb-4 opacity-50" />
                            <p className="text-destructive font-medium">Fehler beim Laden der Termine</p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-4"
                                onClick={() => window.location.reload()}
                            >
                                Erneut versuchen
                            </Button>
                        </CardContent>
                    </Card>
                ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="p-12 text-center">
                            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">Keine Termine in dieser Kategorie gefunden</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-12">
                        {upcomingEvents.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2 text-secondary">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Anstehende Termine
                                </h2>
                                <div className="grid gap-4">
                                    {upcomingEvents.map((event) => (
                                        <EventListItem key={event.id} event={event} isLocked={false} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {pastEvents.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-5 w-5" />
                                    Vergangene Termine
                                </h2>
                                <div className="grid gap-4 opacity-75 grayscale-[0.5]">
                                    {pastEvents.map((event) => (
                                        <EventListItem key={event.id} event={event} isLocked={true} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )
            }
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
        <div id={`event-${event.id}`} className="scroll-mt-24 rounded-xl overflow-hidden">
            <SwipeableEventCard
                eventId={event.id}
                currentStatus={status}
                isLocked={isLocked}
            >
                <Link to={`/member/events/${event.id}`}>
                    <Card className={`transition-all hover:shadow-md hover:border-primary/50 border-l-4 ${borderColor}`}>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                { isLocked ? (
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
                                ) : (
                                <div className="flex-shrink-0 text-center bg-primary/75 rounded-lg p-2 w-16 flex flex-col items-center justify-center">
                                    <div className="text-xs text-secondary/80 uppercase font-semibold">
                                        {new Date(event.date).toLocaleDateString('de-CH', { weekday: 'short' })}
                                    </div>
                                    <div className="text-xl font-bold text-secondary">
                                        {new Date(event.date).getDate()}
                                    </div>
                                    <div className="text-xs text-secondary/80">
                                        {new Date(event.date).toLocaleDateString('de-CH', { month: 'short' })}
                                    </div>
                                </div>)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-semibold truncate">{event.title}</h3>
                                        <Badge variant={categoryVariant[event.category] ?? 'secondary'} className="flex-shrink-0">
                                            {getCategoryLabel(event.category)}
                                        </Badge>
                                        {status && (
                                            <Badge
                                                variant="outline"
                                                className={`ml-auto ${
                                                    status === 'yes'
                                                        ? 'text-success border-success/20 bg-success/5'
                                                        : status === 'no'
                                                            ? 'text-red-600 border-red-200 bg-red-50'
                                                            : 'text-yellow-600 border-yellow-200 bg-yellow-50'
                                                }`}
                                            >
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

                                        <div className="flex gap-2 flex-wrap">
                                            <Badge variant="success" className="gap-1 text-green-800">
                                                <CheckCircle className="h-3 w-3" />
                                                {summary.yes}
                                            </Badge>
                                            <Badge variant="destructive" className="gap-1 text-red-800">
                                                <XCircle className="h-3 w-3" />
                                                {summary.no}
                                            </Badge>
                                            <Badge variant="warning" className="gap-1 text-yellow-800">
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
        </div>
    );
}
