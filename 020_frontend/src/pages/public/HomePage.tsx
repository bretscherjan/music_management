import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Music2, ArrowRight } from 'lucide-react';
import { eventService } from '@/services/eventService';
import type { Event } from '@/types';

export function HomePage() {
    // Fetch upcoming events
    const { data: events = [] } = useQuery({
        queryKey: ['events'],
        queryFn: () => eventService.getAll(),
    });

    // Filter to only show future events, sorted by date
    const upcomingEvents = events
        .filter((event: Event) => new Date(event.date) >= new Date())
        .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6);

    return (
        <div>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[hsl(var(--musig-burgundy))] to-[hsl(var(--musig-burgundy))]/80 text-white py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 animate-pulse">
                        <Music2 className="h-24 w-24 md:h-32 md:w-32" />
                    </div>
                    <div className="absolute bottom-10 right-10 animate-pulse delay-700">
                        <Music2 className="h-16 w-16 md:h-24 md:w-24" />
                    </div>
                </div>

                <div className="container-app relative z-10">
                    <div className="max-w-3xl mx-auto text-center px-4">
                        <img
                            src="/logo.png"
                            alt="Musig Elgg Logo"
                            className="h-28 w-auto md:h-40 mx-auto mb-8 drop-shadow-2xl transition-transform hover:scale-105 duration-300"
                        />
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                            Willkommen bei der Musig Elgg
                        </h1>
                        <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto">
                            Tradition trifft Leidenschaft
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/about"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 bg-white text-[hsl(var(--musig-burgundy))] rounded-lg hover:bg-white/90 transition-all font-medium text-base md:text-lg shadow-lg hover:shadow-xl active:scale-95"
                            >
                                Mehr über uns erfahren
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link
                                to="/contact"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 bg-[hsl(var(--musig-gold))] text-[hsl(var(--musig-dark))] rounded-lg hover:bg-[hsl(var(--musig-gold))]/90 transition-all font-medium text-base md:text-lg shadow-lg hover:shadow-xl active:scale-95"
                            >
                                Kontakt aufnehmen
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upcoming Events */}
            <section className="py-16 md:py-24 bg-[hsl(var(--background))]">
                <div className="container-app">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--musig-burgundy))] mb-4">
                            Kommende Termine
                        </h2>
                        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto px-4">
                            Wir sind mit viel Fleiss und Engagement am Proben für Auftritte und Ständchen.
                        </p>
                    </div>

                    {upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
                            {upcomingEvents.map((event: Event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[hsl(var(--border))] mx-4 md:mx-auto max-w-2xl">
                            <Calendar className="h-16 w-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4 opacity-50" />
                            <p className="text-[hsl(var(--muted-foreground))] text-lg font-medium">
                                Aktuell keine geplanten Termine.
                            </p>
                            <p className="text-[hsl(var(--muted-foreground))]/80 text-sm mt-2">
                                Schauen Sie bald wieder vorbei!
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 md:py-24 bg-gradient-to-r from-[hsl(var(--musig-burgundy))]/5 to-[hsl(var(--musig-gold))]/5">
                <div className="container-app">
                    <div className="max-w-5xl mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold text-[hsl(var(--musig-burgundy))] mb-6">
                            Wie kannst du mitmachen?
                        </h2>
                        <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] mb-12 max-w-2xl mx-auto">
                            Wir sind immer auf der Suche nach neuen Musikerinnen und Musikern.
                            Egal ob alt oder jung, routiniert oder schon lange nicht mehr gespielt.
                        </p>
                        <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] mb-12 max-w-2xl mx-auto">
                            Alle Modelle sind herzlich willkommen, egal wieviel Zeit du investieren möchtest.
                        </p>

                        {/* Mitmach-Optionen als Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                            {[
                                {
                                    title: "Punktuell",
                                    desc: "Einzelne Auftritte, Flexibilität für Kurzentschlossene.",
                                },
                                {
                                    title: "Regelmässig",
                                    desc: "Mehrere Auftritte und regelmässige Proben als fester Bestandteil.",
                                },
                                {
                                    title: "Vereinsmitglied",
                                    desc: "Vollwertiges Mitglied im Verein mit allen Rechten und Pflichten.",
                                }
                            ].map((item, index) => (
                                <div key={index} className="bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-[hsl(var(--musig-burgundy))]/10 shadow-sm">
                                    <h3 className="text-xl font-bold text-[hsl(var(--musig-burgundy))] mb-2">{item.title}</h3>
                                    <p className="text-[hsl(var(--muted-foreground))] leading-snug">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 px-10 py-4 bg-[hsl(var(--musig-burgundy))] text-white rounded-full hover:bg-[hsl(var(--musig-burgundy))]/90 transition-all font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1"
                        >
                            Jetzt Kontakt aufnehmen
                            <ArrowRight className="h-6 w-6" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

interface EventCardProps {
    event: Event;
}

function EventCard({ event }: EventCardProps) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('de-CH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('de-CH', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="bg-gradient-to-br from-[hsl(var(--musig-burgundy))] to-[hsl(var(--musig-burgundy))]/80 p-6 text-white">
                <div className="flex items-start justify-between mb-2">
                    <div className="bg-[hsl(var(--musig-gold))] text-[hsl(var(--musig-dark))] px-3 py-1 rounded-full text-sm font-medium">
                        {eventDate.toLocaleDateString('de-CH', { month: 'short', day: 'numeric' })}
                    </div>
                    <Music2 className="h-6 w-6 opacity-60" />
                </div>
                <h3 className="text-xl font-bold mb-1 group-hover:text-[hsl(var(--musig-gold))] transition-colors">
                    {event.title}
                </h3>
            </div>
            <div className="p-6">
                <div className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[hsl(var(--musig-burgundy))]" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[hsl(var(--musig-burgundy))]" />
                        <span>{formattedTime} Uhr</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[hsl(var(--musig-burgundy))]" />
                            <span>{event.location}</span>
                        </div>
                    )}
                </div>
                {event.description && (
                    <p className="mt-4 text-sm text-[hsl(var(--foreground))] line-clamp-2">
                        {event.description}
                    </p>
                )}
            </div>
        </div>
    );
}
