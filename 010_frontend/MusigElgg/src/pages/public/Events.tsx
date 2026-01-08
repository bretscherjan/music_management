import { Calendar, MapPin, Clock, Users } from 'lucide-react';

// Mock events data
const events = [
    {
        id: 1,
        title: 'Neujahrskonzert 2026',
        date: '2026-01-18',
        time: '19:30',
        location: 'Mehrzweckhalle Elgg',
        description: 'Unser traditionelles Neujahrskonzert mit festlicher Blasmusik und kulinarischen Genüssen.',
        isPublic: true,
        attendees: 120,
    },
    {
        id: 2,
        title: 'Frühlingsständchen',
        date: '2026-03-22',
        time: '10:00',
        location: 'Dorfplatz Elgg',
        description: 'Wir begrüssen den Frühling mit einem öffentlichen Ständchen auf dem Dorfplatz.',
        isPublic: true,
        attendees: null,
    },
    {
        id: 3,
        title: 'Kantonales Musikfest',
        date: '2026-05-15',
        time: '08:00',
        location: 'Winterthur',
        description: 'Die Musig Elgg nimmt am kantonalen Musikfest teil. Wir freuen uns auf Ihre Unterstützung!',
        isPublic: true,
        attendees: null,
    },
    {
        id: 4,
        title: 'Sommerkonzert',
        date: '2026-06-28',
        time: '18:00',
        location: 'Schlossgarten Elgg',
        description: 'Open-Air Konzert im malerischen Schlossgarten mit Sommerhits und Klassikern.',
        isPublic: true,
        attendees: 200,
    },
];

export function Events() {
    return (
        <div className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-primary-800 mb-4">Kommende Anlässe</h1>
                    <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                        Erleben Sie die Musig Elgg live! Hier finden Sie alle öffentlichen Auftritte und Veranstaltungen.
                    </p>
                </div>

                {/* Events Grid */}
                <div className="grid gap-6">
                    {events.map((event) => (
                        <article
                            key={event.id}
                            className="bg-white rounded-xl shadow-card hover:shadow-lg transition-all overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Date Badge */}
                                <div className="md:w-32 bg-gradient-to-br from-primary-800 to-primary-900 p-6 flex flex-col items-center justify-center text-white shrink-0">
                                    <span className="text-3xl font-bold">
                                        {new Date(event.date).getDate()}
                                    </span>
                                    <span className="text-sm uppercase tracking-wide">
                                        {new Date(event.date).toLocaleDateString('de-CH', { month: 'short' })}
                                    </span>
                                    <span className="text-xs mt-1 opacity-80">
                                        {new Date(event.date).getFullYear()}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-6">
                                    <h2 className="text-2xl font-bold text-primary-800 mb-3">{event.title}</h2>
                                    <p className="text-neutral-600 mb-4">{event.description}</p>

                                    <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-secondary-500" />
                                            {event.time} Uhr
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-secondary-500" />
                                            {event.location}
                                        </div>
                                        {event.attendees && (
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-secondary-500" />
                                                ~{event.attendees} Plätze
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="p-6 flex items-center border-t md:border-t-0 md:border-l border-neutral-100">
                                    <button className="px-6 py-3 bg-secondary-500 text-white rounded-lg font-medium hover:bg-secondary-600 transition-colors whitespace-nowrap">
                                        Mehr erfahren
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Subscribe Section */}
                <div className="mt-16 bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-xl p-8 text-center">
                    <Calendar className="mx-auto text-primary-800 mb-4" size={48} />
                    <h3 className="text-2xl font-bold text-primary-800 mb-3">Keine Veranstaltung verpassen</h3>
                    <p className="text-neutral-600 mb-6 max-w-xl mx-auto">
                        Abonnieren Sie unseren Newsletter und erhalten Sie alle Termine direkt in Ihr Postfach.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Ihre E-Mail-Adresse"
                            className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                        />
                        <button className="px-6 py-3 bg-primary-800 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                            Abonnieren
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
