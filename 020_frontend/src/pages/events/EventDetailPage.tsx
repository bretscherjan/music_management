import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { useIsAdmin } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Clock, MapPin, Edit } from 'lucide-react';
import { formatDate, formatTime, getCategoryLabel } from '@/lib/utils';
import { AttendanceSection } from '@/components/events/AttendanceSection';
import { EventSetlistSection } from '@/components/events/EventSetlistSection';

export function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const isAdmin = useIsAdmin();
    const eventId = parseInt(id || '0', 10);

    const { data: event, isLoading, error } = useQuery({
        queryKey: ['event', eventId],
        queryFn: () => eventService.getById(eventId),
        enabled: !!eventId,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-1/3" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="space-y-6">
                <Link to="/member/events">
                    <Button variant="ghost">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Zurück
                    </Button>
                </Link>
                <Card>
                    <CardContent className="p-6 text-center text-destructive">
                        Termin nicht gefunden
                    </CardContent>
                </Card>
            </div>
        );
    }

    const categoryVariant: Record<string, 'default' | 'secondary' | 'warning'> = {
        rehearsal: 'secondary',
        performance: 'default',
        other: 'warning',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <Link to="/member/events">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Zurück zur Liste
                    </Button>
                </Link>

                {isAdmin && (
                    <Link to={`/member/admin/events/${event.id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                        </Button>
                    </Link>
                )}
            </div>

            {/* Event Details */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-2xl">{event.title}</CardTitle>
                                <Badge variant={categoryVariant[event.category]}>
                                    {getCategoryLabel(event.category)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Date & Time */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <div className="font-medium text-foreground">{formatDate(event.date)}</div>
                                <div className="text-sm">Datum</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                                <div className="font-medium text-foreground">
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                </div>
                                <div className="text-sm">Uhrzeit</div>
                            </div>
                        </div>

                        {event.location && (
                            <div className="flex items-center gap-3 text-muted-foreground sm:col-span-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                <div>
                                    <div className="font-medium text-foreground">{event.location}</div>
                                    <div className="text-sm">Ort</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="pt-4 border-t">
                            <h3 className="font-medium mb-2">Beschreibung</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Setlist Section */}
            <EventSetlistSection event={event} isAdmin={isAdmin} />

            {/* Attendance Section */}
            <AttendanceSection
                eventId={event.id}
                eventDate={event.date}
                startTime={event.startTime}
                endTime={event.endTime}
            />
        </div>
    );
}

export default EventDetailPage;
