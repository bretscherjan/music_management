import React, { useState } from 'react';
import { useEvents } from '../events/eventHelper';
import { useEventAttendance } from './attendanceHelper';
import { Calendar, Check, X, Clock, AlertCircle } from 'lucide-react';
import { AttendanceStatus } from '../../api/generated/ApiClient';

export const AttendanceTable: React.FC = () => {
    // 1. Select Event
    const { data: events } = useEvents();
    // Default to first event or next upcoming. For now just take the first one if available.
    // In a real app we'd sort by date and pick the closest.
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // Effect to select first event on load
    React.useEffect(() => {
        if (events && events.length > 0 && !selectedEventId) {
            setSelectedEventId(events[0].id!);
        }
    }, [events, selectedEventId]);

    const { data: attendanceList, isLoading } = useEventAttendance(selectedEventId || '');

    const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedEventId(e.target.value);
    };

    if (!events) return <div>Lade Events...</div>;

    // Calculate stats client-side
    const totalPresent = attendanceList?.filter(r => r.status === AttendanceStatus.Present).length || 0;
    const totalCount = attendanceList?.length || 0;

    return (
        <div className="space-y-6">
            {/* Event Selector */}
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
                <Calendar className="text-primary-600 h-5 w-5" />
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

            {/* Attendance List */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden border border-neutral-200">
                <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-primary-900">Anwesenheitsliste</h3>
                    {attendanceList && (
                        <span className="text-sm text-neutral-500">
                            Präsenz: {totalPresent} / {totalCount}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-neutral-500">Lade Daten...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Mitglied</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Register</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                                {attendanceList?.map((record) => {
                                    // Status Styling
                                    let statusBadge;
                                    const status = record.status as AttendanceStatus;

                                    switch (status) {
                                        case AttendanceStatus.Present:
                                            statusBadge = (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <Check className="h-3 w-3 mr-1" /> Anwesend
                                                </span>
                                            );
                                            break;
                                        case AttendanceStatus.Unexcused:
                                            statusBadge = (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                    <AlertCircle className="h-3 w-3 mr-1" /> Unentschuldigt
                                                </span>
                                            );
                                            break;
                                        case AttendanceStatus.Declined:
                                            statusBadge = (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                                    <X className="h-3 w-3 mr-1" /> Abgemeldet
                                                </span>
                                            );
                                            break;
                                        case AttendanceStatus.Confirmed:
                                            statusBadge = (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                    <Check className="h-3 w-3 mr-1" /> Bestätigt
                                                </span>
                                            );
                                            break;
                                        default:
                                            statusBadge = (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                                                    <Clock className="h-3 w-3 mr-1" /> Offen
                                                </span>
                                            );
                                    }

                                    return (
                                        <tr key={record.userId} className={status === AttendanceStatus.Unexcused ? "bg-red-50/30" : ""}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                                {record.userName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                                {record.registerName || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {statusBadge}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {attendanceList?.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-neutral-500">
                                            Keine Einträge gefunden.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
