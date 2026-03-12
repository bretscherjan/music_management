import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Music2, Clock } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { formatTime, getCategoryLabel } from '@/lib/utils';
import type { Event } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function UpcommingEvents() {
    // Fetch upcoming public events
    const { data: events = [], isLoading } = useQuery({
        queryKey: ['publicEvents'],
        queryFn: () => eventService.getPublicEvents(),
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events
        .filter((event: Event) => new Date(event.date) >= today)
        .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (isLoading) {
        return (
            <div className="py-16 md:py-24 bg-[hsl(var(--background))]">
                <div className="container-app">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-5xl font-bold text-[hsl(var(--musig-primary))] mb-4">
                            Kommende Termine
                        </h1>
                        <p className="text-lg text-[hsl(var(--muted-foreground))]">
                            Wir laden die Termine für Sie...
                        </p>
                    </div>
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-[hsl(var(--border))]" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-16 md:py-24 bg-[hsl(var(--background))]">
            <div className="container-app">
                <div className="text-center mb-12 md:mb-16">
                    <Music2 className="h-16 w-16 text-[hsl(var(--musig-primary))] mx-auto mb-6 opacity-80" />
                    <h1 className="text-3xl md:text-5xl font-bold text-[hsl(var(--musig-primary))] mb-4">
                        Kommende Termine
                    </h1>
                    <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto px-4">
                        Hier finden Sie alle unsere geplanten Auftritte, Proben und Veranstaltungen.
                    </p>
                </div>

                {upcomingEvents.length > 0 ? (
                    <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0">
                        {upcomingEvents.map((event: Event) => (
                            <DetailedEventCard key={event.id} event={event} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[hsl(var(--border))] mx-4 md:mx-auto max-w-2xl">
                        <Calendar className="h-16 w-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4 opacity-50" />
                        <p className="text-[hsl(var(--muted-foreground))] text-xl font-medium">
                            Aktuell keine geplanten Termine.
                        </p>
                        <p className="text-[hsl(var(--muted-foreground))]/80 mt-2">
                            Schauen Sie bald wieder vorbei für neue Informationen!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailedEventCard({ event }: { event: Event }) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('de-CH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    
    const categoryVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
        rehearsal: 'secondary',
        performance: 'default',
        other: 'outline',
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-[hsl(var(--musig-primary))]">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                    {/* Date Block */}
                    <div className="bg-[hsl(var(--musig-primary))]/5 md:w-40 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-[hsl(var(--border))]">
                        <span className="text-sm font-semibold text-[hsl(var(--musig-primary))] uppercase tracking-wider">
                            {eventDate.toLocaleDateString('de-CH', { month: 'short' })}
                        </span>
                        <span className="text-4xl font-bold text-[hsl(var(--musig-primary))] my-1">
                            {eventDate.getDate()}
                        </span>
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                            {eventDate.getFullYear()}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <h3 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                                {event.title}
                            </h3>
                            <Badge variant={categoryVariant[event.category] as any}>
                                {getCategoryLabel(event.category)}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[hsl(var(--muted-foreground))]">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-[hsl(var(--musig-primary))]" />
                                <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[hsl(var(--musig-primary))]" />
                                <span>{formatTime(event.startTime)} {event.endTime ? `- ${formatTime(event.endTime)}` : ''} Uhr</span>
                            </div>
                            {event.location && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                    <MapPin className="h-4 w-4 text-[hsl(var(--musig-primary))]" />
                                    <span>{event.location}</span>
                                </div>
                            )}
                        </div>

                        {event.description && (
                            <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]">
                                <p className="text-[hsl(var(--foreground))] leading-relaxed">
                                    {event.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
