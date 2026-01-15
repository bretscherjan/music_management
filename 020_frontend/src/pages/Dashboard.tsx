import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { newsService } from '@/services/newsService';
import { CreateNewsDialog } from '@/components/news/CreateNewsDialog';
import { useAuth, useIsAdmin } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Clock, ChevronRight, Newspaper, Plus } from 'lucide-react';
import { formatDate, formatTime, getCategoryLabel } from '@/lib/utils';
import type { Event, News } from '@/types';
import { QuickAttendance } from '@/components/dashboard/QuickAttendance';
import { useState } from 'react';

export function Dashboard() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);

    const { data: events, isLoading: eventsLoading } = useQuery({
        queryKey: ['events', 'upcoming'],
        queryFn: () => eventService.getUpcoming(3),
    });

    const { data: news, isLoading: newsLoading } = useQuery({
        queryKey: ['news', 'recent'],
        queryFn: () => newsService.getRecent(5),
    });

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Willkommen, {user?.firstName}!
                </h1>
                <p className="text-muted-foreground">
                    Hier ist deine Übersicht für die kommenden Termine und Neuigkeiten.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Upcoming Events */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Nächste Termine</h2>
                        <Link to="/member/events">
                            <Button variant="ghost" size="sm">
                                Alle Termine <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {eventsLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardContent className="p-6">
                                        <Skeleton className="h-6 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : events && events.length > 0 ? (
                        <div className="space-y-4">
                            {events.map((event: Event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                Keine kommenden Termine
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Attendance */}
                    {events && events.length > 0 && (
                        <QuickAttendance event={events[0]} />
                    )}

                    {/* News Ticker */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Newspaper className="h-5 w-5" />
                                Neuigkeiten
                            </CardTitle>
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsNewsDialogOpen(true)}
                                    className="h-8 w-8"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {newsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : news && news.length > 0 ? (
                                <div className="space-y-3">
                                    {news.map((item: News) => (
                                        <NewsItem key={item.id} news={item} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Keine Neuigkeiten
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <CreateNewsDialog
                open={isNewsDialogOpen}
                onOpenChange={setIsNewsDialogOpen}
            />
        </div>
    );
}

function EventCard({ event }: { event: Event }) {
    const categoryColors: Record<string, 'default' | 'secondary' | 'warning'> = {
        rehearsal: 'secondary',
        performance: 'default',
        other: 'warning',
    };

    return (
        <Link to={`/member/events/${event.id}`}>
            <Card className="transition-all hover:shadow-md hover:border-primary/50">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                <Badge variant={categoryColors[event.category]}>
                                    {getCategoryLabel(event.category)}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(event.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                </span>
                                {event.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {event.location}
                                    </span>
                                )}
                            </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function NewsItem({ news }: { news: News }) {
    const date = new Date(news.createdAt);
    const formattedDate = date.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
    });

    return (
        <div className="border-l-2 border-primary/30 pl-3 py-1">
            <p className="text-sm font-medium line-clamp-1">{news.title}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>
    );
}

export default Dashboard;
