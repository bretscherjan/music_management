import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, HelpCircle, Clock, MapPin } from 'lucide-react';
import type { EventDto, AttendanceDto } from '../../api/web-api-client';
import { EventService } from '../../services/EventService';
import { EventHelper } from '../../helpers/EventHelper';

interface Props {
    event: EventDto | null;
    isOpen: boolean;
    onClose: () => void;
}

export const EventDetailsModal = ({ event, isOpen, onClose }: Props) => {
    const [attendees, setAttendees] = useState<AttendanceDto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event && isOpen) {
            loadAttendees();
        } else {
            setAttendees([]);
        }
    }, [event, isOpen]);

    const loadAttendees = async () => {
        if (!event?.id) return;
        setLoading(true);
        try {
            const data = await EventService.getAttendance(event.id);
            // Sort by Name within register?
            const sorted = data.sort((a, b) => (a.userName || "").localeCompare(b.userName || ""));
            setAttendees(sorted);
        } catch (err) {
            console.error("Failed to load attendees", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !event) return null;

    // Grouping
    const grouped = attendees.reduce((acc, curr) => {
        const instr = curr.instrument || 'Ohne Register';
        if (!acc[instr]) acc[instr] = [];
        acc[instr].push(curr);
        return acc;
    }, {} as Record<string, AttendanceDto[]>);

    const registers = Object.keys(grouped).sort();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${event.type === 'Concert' ? 'bg-secondary' : 'bg-primary'}`}>
                                {event.type === 'Concert' ? 'Konzert' : 'Probe'}
                            </span>
                            <span className="text-gray-500 text-sm font-medium">
                                {EventHelper.formatDate(event.startTime)}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                                <Clock size={16} className="mr-1 text-gray-400" />
                                {EventHelper.formatTime(event.startTime)} - {EventHelper.formatTime(event.endTime)}
                            </div>
                            <div className="flex items-center">
                                <MapPin size={16} className="mr-1 text-gray-400" />
                                {event.location}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow bg-white">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {registers.length === 0 ? (
                                <div className="col-span-full text-center text-gray-500 italic">Keine Anmeldungen bisher.</div>
                            ) : (
                                registers.map((instr) => (
                                    <div key={instr} className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
                                            {instr}
                                        </h3>
                                        <div className="space-y-2">
                                            {grouped[instr].map((att) => (
                                                <div key={att.userId} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                                                    <span className="font-medium text-gray-700">{att.userName}</span>
                                                    <div className="flex items-center space-x-2">
                                                        {att.status === 'Accept' && <CheckCircle size={18} className="text-green-600" />}
                                                        {att.status === 'Decline' && <XCircle size={18} className="text-red-600" />}
                                                        {(!att.status || att.status === 'Unknown' || att.status === 'Unanswered') && <HelpCircle size={18} className="text-gray-300" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600 flex-grow">
                        {event.description && <div className="mb-2"><strong>Details:</strong> {event.description}</div>}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => {
                                EventHelper.vote(event.id!, 'Accept');
                                // Trigger refresh locally? We ideally need a callback to reload data.
                                // For now, just close or user re-opens.
                                // Or better: reload attendees.
                                setTimeout(() => window.location.reload(), 500); // Brute force refresh for now or pass reload callback
                            }}
                            className="flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                        >
                            <CheckCircle size={18} /> <span>Anwesend</span>
                        </button>
                        <button
                            onClick={() => {
                                EventHelper.vote(event.id!, 'Decline');
                                setTimeout(() => window.location.reload(), 500);
                            }}
                            className="flex items-center space-x-2 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                        >
                            <XCircle size={18} /> <span>Abwesend</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
