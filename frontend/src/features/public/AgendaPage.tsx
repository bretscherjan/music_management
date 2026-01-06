import { useState, useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { EventHelper } from '../../helpers/EventHelper';
import type { EventDto } from '../../api/web-api-client';

const AgendaPage = () => {
    const [events, setEvents] = useState<EventDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Public page might not need error handling UI, just empty state if fail
        EventHelper.loadEvents(setEvents, setIsLoading);
    }, []);

    return (
        <div className="bg-paper min-h-screen pb-20">
            {/* Header */}
            <div className="bg-primary text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="font-heading text-4xl font-bold mb-4">Agenda</h1>
                    <p className="text-xl opacity-90">Unsere nächsten Auftritte und Termine.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8">
                <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl mx-auto">
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-500">Lade Termine...</div>
                    ) : (
                        <div className="space-y-8">
                            {events.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">Aktuell keine öffentlichen Termine.</div>
                            ) : (
                                events.map((event) => (
                                    <div key={event.id} className="flex flex-col md:flex-row gap-6 border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                                        {/* Date Badge */}
                                        <div className="flex-shrink-0">
                                            <div className="bg-secondary/10 text-secondary w-20 h-20 rounded-lg flex flex-col items-center justify-center font-heading font-bold border border-secondary/20">
                                                <span className="text-3xl">{event.startTime ? new Date(event.startTime).getDate() : '?'}</span>
                                                <span className="text-sm uppercase">{event.startTime ? new Date(event.startTime).toLocaleString('de-CH', { month: 'short' }) : 'NA'}</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold font-heading text-charcoal mb-2">{event.title}</h3>
                                            <div className="flex flex-wrap gap-4 text-gray-600 mb-3">
                                                <div className="flex items-center">
                                                    <Clock size={18} className="mr-2 text-secondary" />
                                                    {EventHelper.formatTime(event.startTime)}
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin size={18} className="mr-2 text-secondary" />
                                                    {event.location}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 leading-relaxed bg-paper p-4 rounded-lg">
                                                {event.description || "Keine weiteren Details verfügbar."}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgendaPage;
