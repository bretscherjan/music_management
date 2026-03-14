import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { useAuth, useIsAdmin } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, XCircle, HelpCircle, Users, Music, Clock, Edit2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { Attendance, AttendanceStatus } from '@/types';

interface AttendanceSectionProps {
    eventId: number;
    eventDate: string | Date;
    startTime?: string;
    endTime?: string;
}

export function AttendanceSection({ eventId }: AttendanceSectionProps) {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const queryClient = useQueryClient();
    const [comment, setComment] = useState('');
    const [isCommentModified, setIsCommentModified] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['attendances', eventId],
        queryFn: () => eventService.getAttendances(eventId),
    });

    // Check locking based on backend response
    const isLocked = useMemo(() => {
        if (isAdmin) return false;
        // Don't lock while loading
        if (!attendanceData) return false;
        // Use backend provided status
        if (typeof attendanceData.isResponseLocked === 'boolean') {
            return attendanceData.isResponseLocked;
        }
        return false;
    }, [attendanceData, isAdmin]);

    // For convenience, extract attendances array
    const attendances = attendanceData?.attendances || [];

    const { mutate: setAttendance, isPending } = useMutation({
        mutationFn: ({ status, userId, comment }: { status: AttendanceStatus; userId?: number; comment?: string }) =>
            eventService.setAttendance(eventId, { status, userId, comment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendances', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setIsCommentModified(false);
            setError(null);
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || "Fehler beim Speichern";
            setError(msg);
        },
    });

    // Group attendances by register
    const groupedAttendances = useMemo(() => {
        if (!attendances) return [];

        const groups: Map<string, { registerName: string; attendances: Attendance[] }> = new Map();

        attendances.forEach((attendance: Attendance) => {
            const registerName = attendance.user?.register?.name || 'Ohne Register';
            if (!groups.has(registerName)) {
                groups.set(registerName, { registerName, attendances: [] });
            }
            groups.get(registerName)!.attendances.push(attendance);
        });

        return Array.from(groups.values()).sort((a, b) =>
            a.registerName.localeCompare(b.registerName)
        );
    }, [attendances]);

    // Count summary from API response or calculate
    const summary = useMemo(() => {
        if (attendanceData?.summary) return attendanceData.summary;
        if (!attendances) return { yes: 0, no: 0, maybe: 0, pending: 0, total: 0 };
        return {
            yes: attendances.filter((a: Attendance) => a.status === 'yes').length,
            no: attendances.filter((a: Attendance) => a.status === 'no').length,
            maybe: attendances.filter((a: Attendance) => a.status === 'maybe').length,
            pending: attendances.filter((a: Attendance) => a.status === null).length,
            total: attendances.length,
        };
    }, [attendanceData?.summary, attendances]);

    // Find current user's attendance
    const userAttendance = attendances?.find((a: Attendance) => a.userId === user?.id);

    // Initialize comment from existing attendance
    useEffect(() => {
        if (userAttendance?.comment && !isCommentModified) {
            setComment(userAttendance.comment);
        }
    }, [userAttendance?.comment, isCommentModified]);


    const handleStatusChange = (status: AttendanceStatus, userId?: number) => {
        const commentToSend = isCommentModified ? comment : undefined;
        setAttendance({ status, userId, comment: commentToSend });
    };

    const handleCommentChange = (userId: number, newComment: string) => {
        const currentAttendance = attendances.find((a: Attendance) => a.userId === userId);
        const status = currentAttendance?.status || 'maybe';
        setAttendance({ status, userId, comment: newComment });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Anwesenheit
                    </CardTitle>

                    {/* Summary Badges */}
                    <div className="flex gap-2 flex-wrap">
                        <Badge variant="success" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {summary.yes}
                        </Badge>
                        <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            {summary.no}
                        </Badge>
                        <Badge variant="warning" className="gap-1">
                            <HelpCircle className="h-3 w-3" />
                            {summary.maybe}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {summary.pending ?? 0}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Fehler</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {/* My Attendance */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                    <div>
                        <h4 className="font-medium mb-3 flex items-center justify-between">
                            Meine Zusage
                            {isLocked && <Badge variant="outline" className="text-xs">Bearbeitung gesperrt</Badge>}
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                            <AttendanceButton
                                status="yes"
                                isActive={userAttendance?.status === 'yes'}
                                onClick={() => handleStatusChange('yes')}
                                disabled={isPending || isLocked}
                            />
                            <AttendanceButton
                                status="no"
                                isActive={userAttendance?.status === 'no'}
                                onClick={() => handleStatusChange('no')}
                                disabled={isPending || isLocked}
                            />
                            <AttendanceButton
                                status="maybe"
                                isActive={userAttendance?.status === 'maybe'}
                                onClick={() => handleStatusChange('maybe')}
                                disabled={isPending || isLocked}
                            />
                        </div>
                    </div>

                    {/* Comment Input */}
                    {!isLocked && (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Kommentar (optional)..."
                                value={comment}
                                onChange={(e) => {
                                    setComment(e.target.value);
                                    setIsCommentModified(true);
                                }}
                                className="bg-background"
                            />
                        </div>
                    )}
                    {isLocked && userAttendance?.comment && (
                        <div className="text-sm text-muted-foreground italic">
                            Kommentar: {userAttendance.comment}
                        </div>
                    )}
                </div>

                {/* Attendance List by Register */}
                {groupedAttendances.map((group) => (
                    <div key={group.registerName} className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                            <Music className="h-4 w-4" />
                            {group.registerName}
                        </h4>
                        <div className="space-y-2">
                            {group.attendances.map((attendance) => (
                                <AttendanceRow
                                    key={attendance.id ?? `pending-${attendance.userId}`}
                                    attendance={attendance}
                                    isAdmin={isAdmin}
                                    onStatusChange={(status) => handleStatusChange(status, attendance.userId)}
                                    onCommentChange={(newComment) => handleCommentChange(attendance.userId, newComment)}
                                    disabled={isPending}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {attendances?.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                        Noch keine Rückmeldungen
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

interface AttendanceButtonProps {
    status: AttendanceStatus;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}

function AttendanceButton({ status, isActive, onClick, disabled }: AttendanceButtonProps) {
    const config = {
        yes: { icon: CheckCircle, label: 'Ja', activeClass: 'bg-success hover:bg-success' },
        no: { icon: XCircle, label: 'Nein', activeClass: 'bg-red-600 hover:bg-red-700' },
        maybe: { icon: HelpCircle, label: 'Vielleicht', activeClass: 'bg-yellow-600 hover:bg-yellow-700' },
    };

    const { icon: Icon, label, activeClass } = config[status];

    return (
        <Button
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={cn(isActive && activeClass)}
        >
            <Icon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{label}</span>
        </Button>
    );
}

interface AttendanceRowProps {
    attendance: Attendance;
    isAdmin: boolean;
    onStatusChange: (status: AttendanceStatus) => void;
    onCommentChange: (comment: string) => void;
    disabled?: boolean;
}

function AttendanceRow({ attendance, isAdmin, onStatusChange, onCommentChange, disabled }: AttendanceRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editComment, setEditComment] = useState(attendance.comment || '');

    const statusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
        yes: { icon: CheckCircle, color: 'text-success' },
        no: { icon: XCircle, color: 'text-red-600' },
        maybe: { icon: HelpCircle, color: 'text-yellow-600' },
        pending: { icon: Clock, color: 'text-gray-400' },
    };

    const statusKey = attendance.status ?? 'pending';
    const { icon: StatusIcon, color } = statusConfig[statusKey];
    const userName = attendance.user
        ? `${attendance.user.firstName} ${attendance.user.lastName}`
        : 'Unbekannt';

    const handleSaveComment = () => {
        onCommentChange(editComment);
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon className={cn("h-5 w-5 flex-shrink-0", color)} />
                    <span className="truncate">{userName}</span>
                    {!isEditing && attendance.comment && (
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                            – {attendance.comment}
                        </span>
                    )}
                </div>

                {isAdmin && (
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onStatusChange('yes')}
                            disabled={disabled}
                        >
                            <CheckCircle className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onStatusChange('no')}
                            disabled={disabled}
                        >
                            <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onStatusChange('maybe')}
                            disabled={disabled}
                        >
                            <HelpCircle className="h-4 w-4 text-yellow-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setIsEditing(!isEditing)}
                            disabled={disabled}
                            title="Kommentar bearbeiten"
                        >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Admin comment editing */}
            {isAdmin && isEditing && (
                <div className="flex gap-2 mt-2 pl-8">
                    <Input
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Kommentar eingeben..."
                        className="flex-1 h-8 text-sm"
                    />
                    <Button size="sm" onClick={handleSaveComment} disabled={disabled}>
                        OK
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                        ✕
                    </Button>
                </div>
            )}
        </div>
    );
}

export default AttendanceSection;
