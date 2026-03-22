import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { eventService } from '@/services/eventService';
import type { Event } from '@/types';
import { SponsorSlider } from '@/components/public/SponsorSlider';
import { WerbungGrid } from '@/components/public/WerbungGrid';
import { Reveal } from '@/components/ui/Reveal';

export function HomePage() {
    const { data: events = [] } = useQuery({
        queryKey: ['publicEvents'],
        queryFn: () => eventService.getPublicEvents(),
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events
        .filter((event: Event) => new Date(event.date) >= today && event.category === 'performance')
        .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    return (
        <div>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-background pt-16 pb-20 md:pt-24 md:pb-32">
                {/* Animated background blobs */}
                <div className="absolute top-1/3 right-1/4 h-72 w-72 bg-brand-primary/8 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/6 h-56 w-56 bg-brand-yellow/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: '2.5s' }} />
                <div className="absolute top-1/2 left-1/2 h-96 w-96 bg-brand-primary/4 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.2s' }} />

                <div className="container-app relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left order-2 lg:order-1 px-4 lg:px-0">
                            <img
                                src="/logos/logo_on_white.svg"
                                alt="Musig Elgg Logo"
                                className="h-20 w-auto mb-8 drop-shadow-md lg:hidden mx-auto lg:mx-0"
                            />
                            <Reveal delay={80}>
                                <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight text-foreground leading-[1.1]">
                                    Willkomme bi dä Musig Elgg!
                                </h1>
                            </Reveal>
                            <Reveal delay={240}>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Link
                                        to="/about"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition-all font-semibold text-lg shadow-lg hover:shadow-xl active:scale-95"
                                    >
                                        Mehr über uns erfahren
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                    <Link
                                        to="/contact"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-foreground border-2 border-foreground/10 rounded-xl hover:bg-foreground/5 transition-all font-semibold text-lg active:scale-95"
                                    >
                                        Kontakt aufnehmen
                                    </Link>
                                </div>
                            </Reveal>
                        </div>
                        <div className="relative order-1 lg:order-2 px-4 lg:px-0">
                            <Reveal direction="left" delay={100}>
                                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 aspect-[4/3]">
                                    <img
                                        src="/group_picture.jpg"
                                        alt="Musig Elgg Ensemble"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                </div>
                            </Reveal>
                            {/* Decorative Elements */}
                            <div className="absolute -top-6 -right-6 h-32 w-32 bg-brand-primary/10 rounded-full blur-3xl lg:block hidden animate-pulse-glow"></div>
                            <div className="absolute -bottom-10 -left-10 h-48 w-48 bg-brand-yellow/10 rounded-full blur-3xl lg:block hidden animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
                            <img
                                src="/logos/logo_on_white.svg"
                                alt="Musig Elgg Logo"
                                className="absolute -bottom-6 -right-6 h-32 w-auto drop-shadow-xl lg:block hidden z-20 animate-float-slow"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Werbung / Promotions Section */}
            <WerbungGrid />

            {/* Upcoming Events */}
            <section className="py-20 md:py-32 bg-background relative overflow-hidden">
                {/* Decorative accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />
                <div className="absolute -top-24 -right-24 h-64 w-64 bg-brand-yellow/8 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

                <div className="container-app relative z-10">
                    <div className="flex flex-col items-center md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
                        <Reveal className="max-w-2xl px-4 md:px-0 text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                                Kommende Termine
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Wir proben jeden 2. Montag (jeweils ungerade KW) um 20:00 Uhr im Singsaal der Primarschule "Im See" in Elgg.
                            </p>
                        </Reveal>
                        <Reveal delay={100} className="px-4 md:px-0 text-center md:text-right">
                            <Link to="/events" className="text-brand-primary font-bold inline-flex items-center gap-2 hover:underline">
                                Alle Termine ansehen
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </Reveal>
                    </div>

                    {upcomingEvents.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-6 md:gap-8 px-4 md:px-0">
                            {upcomingEvents.map((event: Event, i) => (
                                <Reveal
                                    key={event.id}
                                    delay={i * 100}
                                    className="w-full md:max-w-[calc(50%-1rem)] lg:max-w-[calc(33.333%-1.5rem)]"
                                >
                                    <EventCard event={event} />
                                </Reveal>
                            ))}
                        </div>
                    ) : (
                        <Reveal>
                            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border mx-4 md:mx-auto max-w-2xl shadow-inner">
                                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <p className="text-muted-foreground text-xl font-semibold">
                                    Aktuell keine geplanten Termine.
                                </p>
                                <p className="text-muted-foreground/80 mt-2">
                                    Schauen Sie bald wieder vorbei!
                                </p>
                            </div>
                        </Reveal>
                    )}
                </div>
            </section>

            <SponsorSlider />

            {/* Call to Action */}
            <section className="py-20 md:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-primary/5 -skew-y-3 origin-right transform translate-y-12"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-brand-yellow/8 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
                <div className="container-app relative z-10">
                    <Reveal className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8">
                            Wie kannst du mitmachen?
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
                            Wir sind immer auf der Suche nach neuen Musikerinnen und Musikern. Egal ob alt oder jung, mit dem Schlagzeug oder einem Blasinstrument, routiniert oder schon lange nicht mehr gespielt.
                        </p>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-brand-primary text-white rounded-full hover:bg-brand-primary/90 transition-all font-bold text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                        >
                            Jetzt Kontakt aufnehmen
                            <ArrowRight className="h-6 w-6" />
                        </Link>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}

function EventCard({ event }: { event: Event }) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('de-CH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = formatTime(event.startTime);

    return (
        <div
            className="bg-card rounded-3xl border border-border/40 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col h-full block"
        >
            <div className="p-8 flex-1">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-lg group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                        {eventDate.getDate()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {eventDate.toLocaleDateString('de-CH', { month: 'long' })}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                            {eventDate.getFullYear()}
                        </span>
                    </div>
                </div>

                <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-brand-primary transition-colors leading-tight">
                    {event.title}
                </h3>

                <div className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-brand-primary/60" />
                        <span>{formattedDate} • {formattedTime} Uhr</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-brand-primary/60" />
                            <span>{event.location}</span>
                        </div>
                    )}
                </div>

                {event.description && (
                    <p className="mt-6 text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed italic">
                        "{event.description}"
                    </p>
                )}
            </div>
        </div>
    );
}


