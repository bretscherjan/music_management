import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { useCan } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Clock, MapPin, Edit } from 'lucide-react';
import { formatDate, formatTime, getCategoryLabel } from '@/lib/utils';
import { renderMarkdown } from '@/utils/markdownRenderer';
import { AttendanceSection } from '@/components/events/AttendanceSection';
import { VerificationSection } from '@/components/events/VerificationSection';
import { EventSetlistSection } from '@/components/events/EventSetlistSection';

export function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const can = useCan();
    const canManageEvent = can('events:write');
    const canAdminEvent = can('events:admin');
    const eventId = parseInt(id || '0', 10);

    const { data: event, isLoading, error } = useQuery({
        queryKey: ['event', eventId],
        queryFn: () => eventService.getById(eventId),
        enabled: !!eventId,
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="native-group p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="space-y-4">
                <Link to="/member/events">
                    <Button variant="ghost" size="sm" className="text-primary">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Zurück
                    </Button>
                </Link>
                <div className="native-group p-6 text-center text-destructive text-sm">
                    Termin nicht gefunden
                </div>
            </div>
        );
    }

    const categoryVariant: Record<string, 'default' | 'secondary' | 'warning'> = {
        rehearsal: 'secondary',
        performance: 'default',
        other: 'warning',
    };

    return (
        <div className="space-y-4">
            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
                <Link to="/member/events">
                    <Button variant="ghost" size="sm" className="text-primary gap-1.5">
                        <ArrowLeft className="h-4 w-4" />
                        Zurück
                    </Button>
                </Link>
                {canManageEvent && (
                    <Link to={`/member/admin/events/${event.id}/edit`}>
                        <Button variant="ghost" size="sm" className="btn-tinted-primary gap-1.5">
                            <Edit className="h-4 w-4" />
                            Bearbeiten
                        </Button>
                    </Link>
                )}
            </div>

            {/* Event Details Card */}
            <div className="native-group">
                {/* Title */}
                <div className="px-4 pt-4 pb-3 border-b border-border/40">
                    <div className="flex items-start gap-3 flex-wrap">
                        <h1 className="text-xl font-bold flex-1">{event.title}</h1>
                        <Badge variant={categoryVariant[event.category]}>
                            {getCategoryLabel(event.category)}
                        </Badge>
                    </div>
                </div>

                {/* Info Rows */}
                <div className="divide-y divide-border/40">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="inset-icon bg-primary/10">
                            <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Datum</div>
                            <div className="font-medium text-sm">{formatDate(event.date)}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="inset-icon bg-primary/10">
                            <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Uhrzeit</div>
                            <div className="font-medium text-sm">
                                {formatTime(event.startTime)} – {formatTime(event.endTime)}
                            </div>
                        </div>
                    </div>

                    {event.location && (
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="inset-icon bg-primary/10">
                                <MapPin className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Ort</div>
                                <div className="font-medium text-sm">{event.location}</div>
                            </div>
                        </div>
                    )}

                    {event.description && (
                        <div className="px-4 py-4">
                            <p className="native-section-label mb-2">Beschreibung</p>
                            <div className="text-sm text-muted-foreground leading-relaxed">
                                {renderMarkdown(event.description)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Setlist Section - Only if enabled */}
            {event.setlistEnabled && (
                <EventSetlistSection event={event} isAdmin={canManageEvent} />
            )}

            {/* Attendance Section */}
            <AttendanceSection
                eventId={event.id}
                eventDate={event.date}
                startTime={event.startTime}
                endTime={event.endTime}
            />

            {/* Verification Section (Admin Only) */}
            {canAdminEvent && (
                <div className="mt-4">
                    <VerificationSection eventId={event.id} eventDate={event.date} />
                </div>
            )}
        </div>
    );
}

export default EventDetailPage;
