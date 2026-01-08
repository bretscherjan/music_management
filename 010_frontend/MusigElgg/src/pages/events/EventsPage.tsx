import React from 'react';
import { useEventsHelper } from '../../helpers/useEventsHelper';
import { Link } from 'react-router-dom';

export const EventsPage: React.FC = () => {
    const { events, loading } = useEventsHelper();

    if (loading) return <div className="p-6">Loading Events...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primary-800">Anlässe</h1>
                {/* CheckIn Link for generic check-in page if needed, or per event */}
                <Link to="/checkin" className="btn btn-primary">QR-Scanner (Test)</Link>
            </div>

            <div className="grid gap-6">
                {events.map(event => (
                    <div key={event.id} className="bg-white p-6 rounded-xl shadow-card flex justify-between items-center">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                                {event.isDraft && (
                                    <span className="px-2 py-1 text-xs font-bold text-red-800 bg-red-100 rounded-full">ENTWURF</span>
                                )}
                            </div>
                            <p className="text-gray-600 mb-1">
                                {new Date(event.startTime!).toLocaleDateString('de-CH')} {new Date(event.startTime!).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-gray-500 text-sm">{event.location}</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link to={`/events/${event.id}`} className="text-primary-600 hover:text-primary-800 font-medium">Details</Link>
                            <Link to={`/events/${event.id}/checkin`} className="btn btn-secondary text-sm">Check In</Link>
                        </div>
                    </div>
                ))}
                {events.length === 0 && <p className="text-gray-500">Keine Anlässe gefunden.</p>}
            </div>
        </div>
    );
};
