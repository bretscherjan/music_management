import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { EventHelper } from '../../helpers/EventHelper';
import type { EventDto } from '../../api/web-api-client';
import { EventDetailsModal } from './EventDetailsModal';

const InternalEventsPage = () => {
    // const { user } = useAuth(); // Not used currently
    const [events, setEvents] = useState<EventDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<EventDto | null>(null);

    useEffect(() => {
        EventHelper.loadEvents(setEvents, setIsLoading, setError);
    }, []);

    const handleVote = async (e: React.MouseEvent, id: number, status: string) => {
        e.stopPropagation(); // Prevent opening modal
        const success = await EventHelper.vote(id, status);
        if (success) {
            // Optimistic update or refresh? For now just alert
            // In future: proper state update without reload
            alert("Status gespeichert: " + status);
            // Reload to reflect changes in modal if opened immediately after
            EventHelper.loadEvents(setEvents, () => { }, () => { });
        }
    };

    return (
        <div className="animate-fade-in-up space-y-8">
            <header>
                <h1 className="text-3xl font-heading font-bold text-black flex items-center">
                    <Calendar className="mr-3 text-secondary" size={32} />
                    Termine & Proben
                </h1>
                <p className="text-gray-600 mt-1">Hier findest du alle anstehenden Termine.</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {error && <div className="p-4 bg-red-50 text-red-600">{error}</div>}

                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Lade Termine...</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {events.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 italic">Keine anstehenden Termine.</div>
                        ) : (
                            events.map((evt) => (
                                <div
                                    key={evt.id}
                                    onClick={() => setSelectedEvent(evt)}
                                    className="p-6 flex flex-col md:flex-row gap-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                                >
                                    {/* Date Box */}
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-gray-100 group-hover:bg-white group-hover:shadow-md transition-all rounded-lg w-20 h-20 text-charcoal border border-transparent group-hover:border-gray-200">
                                        <span className="text-xs font-bold uppercase tracking-wider">{evt.startTime ? new Date(evt.startTime).toLocaleString('de-CH', { month: 'short' }) : 'NA'}</span>
                                        <span className="text-2xl font-bold">{evt.startTime ? new Date(evt.startTime).getDate() : '?'}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-grow">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${evt.type === 'Concert' ? 'bg-secondary' : 'bg-primary'}`}>
                                                {evt.type === 'Concert' ? 'Konzert' : 'Probe'}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-black mb-2 group-hover:text-primary transition-colors">{evt.title}</h3>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <Clock size={16} className="mr-1 text-gray-400" />
                                                {EventHelper.formatTime(evt.startTime)} - {EventHelper.formatTime(evt.endTime)}
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin size={16} className="mr-1 text-gray-400" />
                                                {evt.location}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col space-y-2 justify-center min-w-[140px]">
                                        <button
                                            onClick={(e) => handleVote(e, evt.id!, 'Accept')}
                                            className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-lg font-bold text-sm transition-colors z-10"
                                        >
                                            <CheckCircle size={16} /> <span>Anwesend</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleVote(e, evt.id!, 'Decline')}
                                            className="flex items-center justify-center space-x-2 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-lg font-bold text-sm transition-colors z-10"
                                        >
                                            <XCircle size={16} /> <span>Abwesend</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <EventDetailsModal
                event={selectedEvent}
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
            />
        </div>
    );
};

export default InternalEventsPage;
