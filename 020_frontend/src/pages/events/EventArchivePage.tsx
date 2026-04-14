import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Clock, HelpCircle, ChevronLeft, Archive } from 'lucide-react';
import type { Event, EventCategory } from '@/types';
import { EventListItem } from '@/components/events/EventListItem';

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

export function EventArchivePage() {
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');

    const { data: events, isLoading, error } = useQuery({
        queryKey: ['events', { category: selectedCategory }],
        queryFn: () => eventService.getAll(
            selectedCategory !== 'all' ? { category: selectedCategory } : undefined
        ),
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastEvents = [...(events?.filter(e => new Date(e.date) < today) || [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const groupedByMonth = groupByMonth(pastEvents);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pt-1">
                <Link to="/member/events">
                    <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Archive className="h-6 w-6 text-muted-foreground" /> Archiv
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Alle vergangenen Termine</p>
                </div>
            </div>

            {/* Category Filter */}
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

            {/* Archive List */}
            {isLoading ? (
                <div className="native-group divide-y divide-border/50">
                    {[1, 2, 3, 4, 5].map((i) => (
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
            ) : groupedByMonth.length === 0 ? (
                <div className="native-group p-10 text-center">
                    <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-sm text-muted-foreground">Keine vergangenen Termine in dieser Kategorie</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedByMonth.map(({ monthLabel, events: monthEvents }) => (
                        <section key={monthLabel} className="space-y-2">
                            <p className="native-section-label">{monthLabel}</p>
                            <div className="native-group divide-y divide-border/40">
                                {monthEvents.map((event) => (
                                    <EventListItem key={event.id} event={event} isLocked={true} />
                                ))}
                            </div>
                        </section>
                    ))}
                    <p className="text-center text-xs text-muted-foreground pb-4">
                        {pastEvents.length} vergangene Termine
                    </p>
                </div>
            )}
        </div>
    );
}
