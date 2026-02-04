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
import { AttendanceSummary } from '@/components/events/AttendanceSummary';
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-secondary">
                    Willkommen, {user?.firstName}!
                </h1>
                <p className="text-muted-foreground text-lg">
                    Hier ist deine Übersicht für die kommenden Termine und Neuigkeiten.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Upcoming Events */}
                <div className="md:col-span-1 lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-foreground/80">Nächste Termine</h2>
                        <Link to="/member/events">
                            <Button variant="ghost" size="sm" className="hover:text-primary hover:bg-primary/10">
                                Alle Termine <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {eventsLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="border-border/50 shadow-sm">
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
                        <Card className="border-dashed">
                            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                                <Calendar className="h-10 w-10 opacity-20" />
                                <p>Keine kommenden Termine</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">

                    {/* News Ticker */}
                    <Card className="border-primary/20 shadow-md bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-primary/10">
                            <CardTitle className="flex items-center gap-2 text-secondary">
                                <Newspaper className="h-5 w-5 text-primary" />
                                Neuigkeiten
                            </CardTitle>
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsNewsDialogOpen(true)}
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-4">
                            {newsLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-16 w-full rounded-md" />
                                    ))}
                                </div>
                            ) : news && news.length > 0 ? (
                                <div className="space-y-4">
                                    {news.map((item: News) => (
                                        <NewsItem key={item.id} news={item} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
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
            <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/50 group bg-card hover:bg-accent/5 active-scale">
                <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                    {event.title}
                                </h3>
                                <Badge variant={categoryColors[event.category]} className="capitalize">
                                    {getCategoryLabel(event.category)}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-muted-foreground">
                                <span className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary/70" />
                                    {formatDate(event.date)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary/70" />
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                </span>
                                {event.location && (
                                    <span className="flex items-center gap-2 sm:col-span-2">
                                        <MapPin className="h-4 w-4 text-primary/70" />
                                        {event.location}
                                    </span>
                                )}
                            </div>

                            {/* Attendance Summary */}
                            {event.attendanceSummary && (
                                <div className="mt-4 pt-3 border-t border-border/50">
                                    <AttendanceSummary summary={event.attendanceSummary} />
                                </div>
                            )}
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors self-center" />
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
