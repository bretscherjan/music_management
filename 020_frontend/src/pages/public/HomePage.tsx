import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Music2, ArrowRight, Users } from 'lucide-react';
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
            <section className="relative bg-gradient-to-br from-[hsl(var(--musig-burgundy))] to-[hsl(var(--musig-burgundy))]/80 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 animate-pulse">
                        <Music2 className="h-32 w-32" />
                    </div>
                    <div className="absolute bottom-10 right-10 animate-pulse delay-700">
                        <Music2 className="h-24 w-24" />
                    </div>
                </div>

                <div className="container-app relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <img
                            src="/logo.png"
                            alt="Musig Elgg Logo"
                            className="h-40 w-auto mx-auto mb-8 drop-shadow-2xl"
                        />
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Willkommen bei der Musig Elgg
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                            Tradition trifft Leidenschaft – Musikverein seit 1896
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/about"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[hsl(var(--musig-burgundy))] rounded-lg hover:bg-white/90 transition-all font-medium text-lg shadow-lg hover:shadow-xl"
                            >
                                Über uns erfahren
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link
                                to="/contact"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[hsl(var(--musig-gold))] text-[hsl(var(--musig-dark))] rounded-lg hover:bg-[hsl(var(--musig-gold))]/90 transition-all font-medium text-lg shadow-lg hover:shadow-xl"
                            >
                                Kontakt aufnehmen
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Proben Info */}
            <section className="py-12 bg-white">
                <div className="container-app">
                    <div className="max-w-4xl mx-auto bg-gradient-to-r from-[hsl(var(--musig-gold))]/10 to-[hsl(var(--musig-burgundy))]/10 rounded-2xl p-8 border-2 border-[hsl(var(--musig-gold))]/30">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-[hsl(var(--musig-burgundy))] text-white p-4 rounded-full">
                                    <Calendar className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[hsl(var(--musig-burgundy))]">
                                        Unsere Proben
                                    </h3>
                                    <p className="text-lg text-[hsl(var(--muted-foreground))]">
                                        Jeden Montag um 20:00 Uhr
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--musig-burgundy))] text-white rounded-lg hover:bg-[hsl(var(--musig-burgundy))]/90 transition-colors font-medium"
                            >
                                <Users className="h-5 w-5" />
                                Mitglied werden
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upcoming Events */}
            <section className="py-16">
                <div className="container-app">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-[hsl(var(--musig-burgundy))] mb-4">
                            Kommende Termine
                        </h2>
                        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                            Besuchen Sie uns bei unseren nächsten Auftritten und Veranstaltungen
                        </p>
                    </div>

                    {upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map((event: Event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="h-16 w-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                            <p className="text-[hsl(var(--muted-foreground))] text-lg">
                                Aktuell keine geplanten Termine. Schauen Sie bald wieder vorbei!
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 bg-gradient-to-r from-[hsl(var(--musig-burgundy))]/5 to-[hsl(var(--musig-gold))]/5">
                <div className="container-app">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-[hsl(var(--musig-burgundy))] mb-4">
                            Interesse an Blasmusik?
                        </h2>
                        <p className="text-lg text-[hsl(var(--muted-foreground))] mb-8">
                            Wir sind immer auf der Suche nach neuen Musikerinnen und Musikern.
                            Kontaktieren Sie uns für eine unverbindliche Schnupperprobe!
                        </p>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-[hsl(var(--musig-burgundy))] text-white rounded-lg hover:bg-[hsl(var(--musig-burgundy))]/90 transition-colors font-medium text-lg shadow-lg"
                        >
                            Jetzt Kontakt aufnehmen
                            <ArrowRight className="h-5 w-5" />
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
