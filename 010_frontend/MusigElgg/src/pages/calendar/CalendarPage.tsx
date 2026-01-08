import React, { useState, useMemo } from 'react';
import { useEventsHelper } from '../../helpers/useEventsHelper';
import { Link } from 'react-router-dom';
import type { EventResponseDto } from '../../api/generated/ApiClient';

type ViewMode = 'list' | 'calendar';

// Simulated register limit data (would come from API in production)
interface RegisterLimitDisplay {
    registerName: string;
    current: number;
    max: number;
}

const mockRegisterLimits: { [eventId: string]: RegisterLimitDisplay[] } = {
    // This would be fetched from API per event
};

export const CalendarPage: React.FC = () => {
    const { events, loading } = useEventsHelper();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedEvent, setSelectedEvent] = useState<EventResponseDto | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Filter only future events and sort by date ascending for calendar
    const sortedEvents = useMemo(() =>
        [...events].sort((a, b) =>
            new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime()
        ), [events]);

    // Group events by date for calendar view
    const eventsByDate = useMemo(() => {
        const map: { [key: string]: EventResponseDto[] } = {};
        sortedEvents.forEach(evt => {
            if (evt.startTime) {
                const key = new Date(evt.startTime).toISOString().split('T')[0];
                if (!map[key]) map[key] = [];
                map[key].push(evt);
            }
        });
        return map;
    }, [sortedEvents]);

    // Calendar grid generation
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];

        // Padding for first week (Monday = 1, Sunday = 0 -> adjust)
        const startPadding = (firstDay.getDay() + 6) % 7;
        for (let i = 0; i < startPadding; i++) days.push(null);

        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }
        return days;
    }, [currentMonth]);

    const handleRsvp = async (eventId: string, accept: boolean) => {
        // TODO: Integrate with actual RSVP API endpoint
        console.log(`RSVP ${accept ? 'accepted' : 'declined'} for event ${eventId}`);
        alert(accept ? 'Zusage erfolgreich!' : 'Absage erfolgreich!');
    };

    const RegisterLimitsBar = ({ limits }: { limits: RegisterLimitDisplay[] }) => (
        <div className="space-y-2 mt-4">
            {limits.map((limit, idx) => (
                <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{limit.registerName}</span>
                        <span className="font-semibold text-primary-800">{limit.current}/{limit.max}</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div
                            className="h-2.5 rounded-full transition-all duration-300"
                            style={{
                                width: `${Math.min((limit.current / limit.max) * 100, 100)}%`,
                                backgroundColor: '#C5A059'
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );

    const EventCard = ({ event, onClick }: { event: EventResponseDto; onClick: () => void }) => {
        const isDraft = event.isDraft;
        return (
            <div
                onClick={onClick}
                className={`
                    bg-white p-5 rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md
                    ${isDraft ? 'border-2 border-dashed border-primary-300 opacity-70' : 'border border-neutral-200'}
                `}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-primary-800">{event.title}</h3>
                            {isDraft && (
                                <span className="px-2 py-0.5 text-xs font-bold text-primary-700 bg-primary-100 rounded-full">
                                    ENTWURF
                                </span>
                            )}
                            {event.isCancelled && (
                                <span className="px-2 py-0.5 text-xs font-bold text-red-700 bg-red-100 rounded-full">
                                    ABGESAGT
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">
                            {event.startTime && new Date(event.startTime).toLocaleDateString('de-CH', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                            {event.startTime && ` • ${new Date(event.startTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                    </div>
                    {event.category && (
                        <div
                            className="px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: event.category.colorHex || '#801010' }}
                        >
                            {event.category.name}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const EventDetailModal = () => {
        if (!selectedEvent) return null;

        // Mock register limits for demonstration
        const limits: RegisterLimitDisplay[] = mockRegisterLimits[selectedEvent.id || ''] || [
            { registerName: 'Trompete', current: 3, max: 5 },
            { registerName: 'Klarinette', current: 4, max: 6 },
            { registerName: 'Schlagzeug', current: 2, max: 3 },
        ];

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
                <div
                    className="bg-neutral-50 rounded-2xl max-w-lg w-full p-6 shadow-xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-primary-800">{selectedEvent.title}</h2>
                            {selectedEvent.isDraft && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold text-primary-700 bg-primary-100 rounded-full border border-dashed border-primary-400">
                                    ENTWURF
                                </span>
                            )}
                        </div>
                        <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                    </div>

                    <div className="space-y-3 text-gray-700 mb-6">
                        <p className="flex items-center gap-2">
                            <span className="text-lg">📅</span>
                            {selectedEvent.startTime && new Date(selectedEvent.startTime).toLocaleDateString('de-CH', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-lg">⏰</span>
                            {selectedEvent.startTime && new Date(selectedEvent.startTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                            {selectedEvent.endTime && ` - ${new Date(selectedEvent.endTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-lg">📍</span>
                            {selectedEvent.location || 'Ort wird bekannt gegeben'}
                        </p>
                        {selectedEvent.description && (
                            <p className="text-gray-600 mt-2">{selectedEvent.description}</p>
                        )}
                    </div>

                    {/* Register Limits Progress */}
                    <div className="bg-white rounded-xl p-4 border border-neutral-200">
                        <h3 className="font-semibold text-primary-800 mb-2">Anmeldungen nach Register</h3>
                        <RegisterLimitsBar limits={limits} />
                    </div>

                    {/* RSVP Buttons */}
                    {!selectedEvent.isDraft && !selectedEvent.isCancelled && (
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => handleRsvp(selectedEvent.id!, true)}
                                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-colors"
                                style={{ backgroundColor: '#C5A059' }}
                            >
                                ✓ Zusagen
                            </button>
                            <button
                                onClick={() => handleRsvp(selectedEvent.id!, false)}
                                className="flex-1 py-3 px-4 rounded-xl font-semibold border-2 border-primary-600 text-primary-700 hover:bg-primary-50 transition-colors"
                            >
                                ✗ Absagen
                            </button>
                        </div>
                    )}

                    <Link
                        to={`/events/${selectedEvent.id}`}
                        className="block text-center mt-4 text-primary-600 hover:text-primary-800 font-medium"
                    >
                        Mehr Details →
                    </Link>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F7F2' }}>
                <div className="text-primary-800 text-lg">Termine werden geladen...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#F9F7F2' }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold" style={{ color: '#801010' }}>Terminübersicht</h1>
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-neutral-200">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'list'
                                ? 'text-white'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                        style={viewMode === 'list' ? { backgroundColor: '#801010' } : {}}
                    >
                        Liste
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'calendar'
                                ? 'text-white'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                        style={viewMode === 'calendar' ? { backgroundColor: '#801010' } : {}}
                    >
                        Kalender
                    </button>
                </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
                <div className="space-y-4">
                    {sortedEvents.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Keine Termine gefunden.</div>
                    ) : (
                        sortedEvents.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onClick={() => setSelectedEvent(event)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                    {/* Month Navigation */}
                    <div className="flex justify-between items-center p-4 border-b border-neutral-200">
                        <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                            className="p-2 hover:bg-neutral-100 rounded-lg text-gray-600"
                        >
                            ← Vorher
                        </button>
                        <h2 className="text-xl font-bold text-primary-800">
                            {currentMonth.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                            className="p-2 hover:bg-neutral-100 rounded-lg text-gray-600"
                        >
                            Nächster →
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-neutral-200">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, idx) => {
                            const dateKey = day ? day.toISOString().split('T')[0] : '';
                            const dayEvents = dateKey ? eventsByDate[dateKey] || [] : [];
                            const isToday = day && day.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={idx}
                                    className={`
                                        min-h-[100px] p-2 border-b border-r border-neutral-100
                                        ${day ? 'bg-white' : 'bg-neutral-50'}
                                        ${isToday ? 'bg-primary-50' : ''}
                                    `}
                                >
                                    {day && (
                                        <>
                                            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-800 font-bold' : 'text-gray-600'}`}>
                                                {day.getDate()}
                                            </div>
                                            <div className="space-y-1">
                                                {dayEvents.slice(0, 2).map(evt => (
                                                    <div
                                                        key={evt.id}
                                                        onClick={() => setSelectedEvent(evt)}
                                                        className={`
                                                            text-xs p-1 rounded cursor-pointer truncate transition-colors
                                                            ${evt.isDraft
                                                                ? 'border border-dashed border-primary-300 text-primary-600 opacity-70 bg-primary-50'
                                                                : 'text-white'
                                                            }
                                                        `}
                                                        style={!evt.isDraft ? { backgroundColor: evt.category?.colorHex || '#801010' } : {}}
                                                    >
                                                        {evt.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 2 && (
                                                    <div className="text-xs text-gray-500">+{dayEvents.length - 2} mehr</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
            <EventDetailModal />
        </div>
    );
};
