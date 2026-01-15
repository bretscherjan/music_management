import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Event, AttendanceStatus, Attendance } from '@/types';

interface QuickAttendanceProps {
    event: Event;
}

export function QuickAttendance({ event }: QuickAttendanceProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);

    const { data: attendanceData } = useQuery({
        queryKey: ['attendances', event.id],
        queryFn: () => eventService.getAttendances(event.id),
        enabled: !!event.id,
    });

    // Find current user's attendance
    const attendances = attendanceData?.attendances || [];
    const userAttendance = attendances.find((a: Attendance) => a.userId === user?.id);
    const currentStatus = selectedStatus || userAttendance?.status || null;

    const { mutate: setAttendance, isPending } = useMutation({
        mutationFn: (status: AttendanceStatus) =>
            eventService.setAttendance(event.id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendances', event.id] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });

    const handleStatusClick = (status: AttendanceStatus) => {
        setSelectedStatus(status);
        setAttendance(status);
    };

    const statusButtons = [
        { status: 'yes' as AttendanceStatus, icon: CheckCircle, label: 'Dabei', color: 'text-green-600' },
        { status: 'no' as AttendanceStatus, icon: XCircle, label: 'Nicht dabei', color: 'text-red-600' },
        { status: 'maybe' as AttendanceStatus, icon: HelpCircle, label: 'Vielleicht', color: 'text-yellow-600' },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Schnelle Zusage</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-1">
                    {event.title}
                </p>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    {statusButtons.map(({ status, icon: Icon, label, color }) => (
                        <Button
                            key={status}
                            variant={currentStatus === status ? 'default' : 'outline'}
                            size="touch"
                            className={cn(
                                "flex-1 flex-col h-auto py-3 gap-1",
                                currentStatus === status && "ring-2 ring-offset-2 ring-primary"
                            )}
                            onClick={() => handleStatusClick(status)}
                            disabled={isPending}
                        >
                            <Icon className={cn("h-6 w-6", currentStatus !== status && color)} />
                            <span className="text-xs">{label}</span>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default QuickAttendance;
