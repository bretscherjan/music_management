import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Music2 } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { formatTime } from '@/lib/utils';
import type { Event } from '@/types';

const categoryConfig: Record<string, { label: string; border: string; badge: string }> = {
    performance: {
        label: 'Auftritt',
        border: 'border-l-primary',
        badge: 'bg-primary/10 text-primary',
    },
    rehearsal: {
        label: 'Probe',
        border: 'border-l-border',
        badge: 'bg-muted text-muted-foreground',
    },
    other: {
        label: 'Event',
        border: 'border-l-brand-yellow',
        badge: 'bg-brand-yellow/20 text-foreground/70',
    },
};

export function UpcommingEvents() {
    const { data: events = [], isLoading } = useQuery({
        queryKey: ['publicEvents'],
        queryFn: () => eventService.getPublicEvents(),
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events
        .filter((event: Event) => new Date(event.date) >= today)
        .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const grouped = upcomingEvents.reduce((acc: Record<string, Event[]>, event: Event) => {
        const key = new Date(event.date).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <div className="py-12 bg-background min-h-screen">
                <div className="container-app max-w-2xl mx-auto px-4">
                    <div className="h-8 w-48 bg-muted animate-pulse rounded-lg mb-8" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-card rounded-xl animate-pulse border border-border/10 mb-2" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="py-12 bg-background min-h-screen">
            <div className="container-app">
                <header className="mb-8 px-4 max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 tracking-tight">
                        Kommende Termine
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Wir freuen uns auf Ihren Besuch!
                    </p>
                </header>

                {upcomingEvents.length > 0 ? (
                    <div className="max-w-2xl mx-auto px-4 space-y-6">
                        {Object.entries(grouped).map(([month, monthEvents]) => (
                            <div key={month}>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-2 px-1">
                                    {month}
                                </h2>
                                <div className="space-y-1.5">
                                    {monthEvents.map((event: Event) => (
                                        <EventRow key={event.id} event={event} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 max-w-md mx-auto">
                        <div className="h-14 w-14 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Music2 className="h-7 w-7 text-muted-foreground opacity-40" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground mb-1">Keine Termine</h2>
                        <p className="text-sm text-muted-foreground">
                            Aktuell sind keine öffentlichen Termine geplant. Schauen Sie bald wieder vorbei!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function EventRow({ event }: { event: Event }) {
    const eventDate = new Date(event.date);
    const config = categoryConfig[event.category] ?? categoryConfig.other;

    return (
        <div className={`flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border/10 border-l-4 ${config.border} hover:shadow-md transition-all duration-200 group`}>
            {/* Date */}
            <div className="flex-none text-center w-10 shrink-0">
                <div className="text-xl font-black leading-none text-foreground">
                    {eventDate.getDate()}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {eventDate.toLocaleDateString('de-CH', { month: 'short' })}
                </div>
            </div>

            <div className="w-px h-8 bg-border/60 shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${config.badge}`}>
                        {config.label}
                    </span>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {event.title}
                    </h3>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ''} Uhr
                    </span>
                    {event.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{event.location}</span>
                        </span>
                    )}
                </div>
                {event.description && (
                    <p className="text-xs text-muted-foreground/60 mt-1 italic line-clamp-1">{event.description}</p>
                )}
            </div>

            {event.category === 'performance' && (
                <div className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary opacity-50" />
            )}
        </div>
    );
}
