import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReminderJob {
    id: string;
    eventId: number;
    eventTitle?: string;
    intervalMinutes: number;
    runAt: string;
    attempts: number;
    failedReason?: string;
}

interface QueueStatus {
    counts: {
        wait: number;
        active: number;
        delayed: number;
        failed: number;
        completed: number;
    };
    upcoming: ReminderJob[];
    error?: string;
}

export function ReminderStatus() {
    const [status, setStatus] = useState<QueueStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/admin/reminders');
            setStatus(res.data);
        } catch (error) {
            console.error('Failed to fetch reminder status', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Poll every 30 seconds
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Erinnerungen</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
                        Laden...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!status || status.error) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Fehler
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Status konnte nicht geladen werden.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Geplante Erinnerungen
                    </CardTitle>
                    <Badge variant="outline" className="font-mono">
                        {status.counts.delayed} geplant
                    </Badge>
                </div>
                <CardDescription>
                    Warteschlange für automatische Benachrichtigungen
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md">
                        <span className="text-xs text-muted-foreground uppercase">Aktiv</span>
                        <span className="text-lg font-bold">{status.counts.active}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md">
                        <span className="text-xs text-muted-foreground uppercase">Wartend</span>
                        <span className="text-lg font-bold">{status.counts.wait}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md">
                        <span className="text-xs text-muted-foreground uppercase text-destructive">Fehler</span>
                        <span className={`text-lg font-bold ${status.counts.failed > 0 ? 'text-destructive' : ''}`}>
                            {status.counts.failed}
                        </span>
                    </div>
                </div>

                <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Nächste 5 Ausführungen
                    </h4>

                    {status.upcoming.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Keine ausstehenden Erinnerungen.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {status.upcoming.slice(0, 5).map((job) => (
                                <div key={job.id} className="flex flex-col p-2 rounded-md border border-border/40 bg-card hover:bg-muted/10 transition-colors text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium truncate pr-2">
                                            {job.eventTitle || `Event #${job.eventId}`}
                                        </span>
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
                                            {job.intervalMinutes} min vor
                                        </Badge>
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                            {format(new Date(job.runAt), "d. MMM, HH:mm", { locale: de })}
                                        </span>
                                        {job.attempts > 0 && (
                                            <span className="text-orange-500 ml-auto flex items-center">
                                                Versuch {job.attempts + 1}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
