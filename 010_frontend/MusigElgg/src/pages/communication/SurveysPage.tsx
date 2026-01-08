import React from 'react';
import { useEvents } from '../events/eventHelper';
import { useSurveys } from './surveyHelper';
import { SurveyCard } from './SurveyCard';
import { Filter, MessageSquare } from 'lucide-react';

export const SurveysPage: React.FC = () => {
    // Ideally we would fetch ALL active surveys for the user, regardless of event.
    // The current API `byEvent2` requires an eventId. 
    // And `surveys` POST is for creation.
    // Is there a `surveysAll`? Or do we need to iterate events?
    // Given the API limitations shown in snippets, I'll fetch active events and then their surveys,
    // or assume the user wants to see surveys for the "next upcoming" event or select one.
    // However, "Communication" usually implies a central board.
    // I'll stick to a similar pattern as Attendance: Select Event (or "All"?).
    // Wait, `apiService.surveys` usually implies GET all if no body? 
    // No, `surveys(body)` is POST.
    // `byEvent2` is the only GET list.
    // So I must provide an Event Selector to see surveys.

    const { data: events } = useEvents();
    const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);

    // Auto-select first event
    React.useEffect(() => {
        if (events && events.length > 0 && !selectedEventId) {
            setSelectedEventId(events[0].id!);
        }
    }, [events, selectedEventId]);

    const { data: surveys, isLoading } = useSurveys(selectedEventId || '');

    const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedEventId(e.target.value);
    };

    if (!events) return <div>Lade Events...</div>;

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header */}
            <div className="bg-primary-900 text-white p-6 shadow-md">
                <div className="flex items-center mb-2">
                    <MessageSquare className="h-6 w-6 mr-3 text-[#C5A059]" />
                    <h1 className="text-2xl font-bold">Umfragen</h1>
                </div>
                <p className="text-primary-200 text-sm">Deine Meinung zählt! Nimm an aktuellen Abstimmungen teil.</p>
            </div>

            <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
                {/* Event Selector */}
                <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
                    <Filter className="text-primary-600 h-5 w-5" />
                    <select
                        value={selectedEventId || ''}
                        onChange={handleEventChange}
                        className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2"
                    >
                        <option value="" disabled>Event wählen</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {new Date(ev.startTime!).toLocaleDateString('de-CH')} - {ev.title}
                            </option>
                        ))}
                    </select>
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-neutral-500">Lade Umfragen...</div>
                ) : (
                    <div className="space-y-6">
                        {surveys && surveys.length > 0 ? (
                            surveys.map(survey => (
                                <SurveyCard key={survey.id} survey={survey} />
                            ))
                        ) : (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-100 text-center">
                                <p className="text-neutral-500 text-lg">Keine Umfragen für diesen Event gefunden.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
