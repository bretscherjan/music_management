import { Link } from 'react-router-dom';
import { MapPin, Clock, CheckCircle, XCircle, HelpCircle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatTime, getCategoryLabel } from '@/lib/utils';
import type { Event } from '@/types';
import { SwipeableEventCard } from '@/components/events/SwipeableEventCard';

export const categoryVariant: Record<string, 'default' | 'secondary' | 'warning'> = {
    rehearsal: 'secondary',
    performance: 'default',
    other: 'warning',
};

export function EventListItem({ event, isLocked }: { event: Event; isLocked: boolean }) {
    const status = event.attendances?.[0]?.status ?? null;
    const statusBorderColor = {
        yes: 'border-l-green-500',
        no: 'border-l-red-500',
        maybe: 'border-l-yellow-500',
    };

    const borderColor = status
        ? statusBorderColor[status as keyof typeof statusBorderColor]
        : 'border-l-transparent';

    const summary = event.attendanceSummary || { yes: 0, no: 0, maybe: 0, pending: 0, total: 0 };

    return (
        <div id={`event-${event.id}`} className="scroll-mt-24">
            <SwipeableEventCard eventId={event.id} currentStatus={status} isLocked={isLocked}>
                <Link to={`/member/events/${event.id}`}>
                    <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors border-l-4 ${borderColor}`}>
                        {/* Date Badge */}
                        <div className={cn(
                            "flex-shrink-0 text-center rounded-xl w-12 h-14 flex flex-col items-center justify-center",
                            isLocked ? "bg-muted" : "bg-primary/15"
                        )}>
                            <div className="text-[10px] font-semibold uppercase text-muted-foreground leading-none">
                                {new Date(event.date).toLocaleDateString('de-CH', { weekday: 'short' })}
                            </div>
                            <div className={cn("text-xl font-bold leading-tight", isLocked ? "text-muted-foreground" : "text-primary")}>
                                {new Date(event.date).getDate()}
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-none">
                                {new Date(event.date).toLocaleDateString('de-CH', { month: 'short' })}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-sm truncate">{event.title}</span>
                                <Badge variant={categoryVariant[event.category] ?? 'secondary'} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                    {getCategoryLabel(event.category)}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(event.startTime)}
                                </span>
                                {event.location && (
                                    <span className="flex items-center gap-1 truncate">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                    </span>
                                )}
                            </div>
                            {/* Attendance mini-summary */}
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[11px] text-green-600 font-medium flex items-center gap-0.5">
                                    <CheckCircle className="h-3 w-3" />{summary.yes}
                                </span>
                                <span className="text-[11px] text-red-500 font-medium flex items-center gap-0.5">
                                    <XCircle className="h-3 w-3" />{summary.no}
                                </span>
                                <span className="text-[11px] text-yellow-600 font-medium flex items-center gap-0.5">
                                    <HelpCircle className="h-3 w-3" />{summary.maybe}
                                </span>
                                {status && (
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] px-1.5 py-0 ml-auto flex-shrink-0",
                                        status === 'yes' ? 'text-green-600 border-green-200' :
                                        status === 'no' ? 'text-red-600 border-red-200' :
                                        'text-yellow-600 border-yellow-200'
                                    )}>
                                        {status === 'yes' ? 'Zugesagt' : status === 'no' ? 'Abgesagt' : 'Vielleicht'}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Chevron affordance */}
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    </div>
                </Link>
            </SwipeableEventCard>
        </div>
    );
}
