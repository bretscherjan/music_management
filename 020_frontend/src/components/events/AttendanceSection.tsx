import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { useAuth, useCan } from '@/context/AuthContext';
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
    const can = useCan();
    const canAdminAttendance = can('events:admin');
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
        if (canAdminAttendance) return false;
        // Don't lock while loading
        if (!attendanceData) return false;
        // Use backend provided status
        if (typeof attendanceData.isResponseLocked === 'boolean') {
            return attendanceData.isResponseLocked;
        }
        return false;
    }, [attendanceData, canAdminAttendance]);

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
            <div className="native-group divide-y divide-border/40">
                <div className="px-4 py-3">
                    <Skeleton className="h-5 w-36" />
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with summary */}
            <div className="native-group">
                <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-4 border-b border-border/40">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        Anwesenheit
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                        <Badge variant="success" className="gap-1 text-green-900/70">
                            <CheckCircle className="h-3 w-3 text-green-900/70" />
                            {summary.yes}
                        </Badge>
                        <Badge variant="destructive" className="gap-1 text-red-900/70">
                            <XCircle className="h-3 w-3 text-red-900/70" />
                            {summary.no}
                        </Badge>
                        <Badge variant="warning" className="gap-1 text-yellow-900/70">
                            <HelpCircle className="h-3 w-3 text-yellow-900/70" />
                            {summary.maybe}
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-black">
                            <Clock className="h-3 w-3 text-black" />
                            {summary.pending ?? 0}
                        </Badge>
                    </div>
                </div>

                {/* My Attendance */}
                <div className="p-4 space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Fehler</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Meine Zusage</h4>
                            {isLocked && <Badge variant="outline" className="text-xs">Bearbeitung gesperrt</Badge>}
                        </div>
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
                </div>
            </div>

            {/* Attendance List by Register */}
            {groupedAttendances.length > 0 && (
                <div className="space-y-2">
                    <p className="native-section-label">Rückmeldungen</p>
                    <div className="native-group divide-y divide-border/40">
                        {groupedAttendances.map((group) => (
                            <div key={group.registerName}>
                                <div className="px-4 py-2 bg-muted/40 flex items-center gap-1.5">
                                    <Music className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-muted-foreground">{group.registerName}</span>
                                </div>
                                <div className="divide-y divide-border/30">
                                    {group.attendances.map((attendance) => (
                                        <AttendanceRow
                                            key={attendance.id ?? `pending-${attendance.userId}`}
                                            attendance={attendance}
                                            isAdmin={canAdminAttendance}
                                            onStatusChange={(status) => handleStatusChange(status, attendance.userId)}
                                            onCommentChange={(newComment) => handleCommentChange(attendance.userId, newComment)}
                                            disabled={isPending}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {attendances?.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">
                    Noch keine Rückmeldungen
                </p>
            )}
        </div>
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
        yes: { icon: CheckCircle, label: 'Ja', activeClass: 'bg-success hover:bg-success text-white', inactiveClass: 'bg-green-50 text-green-700 border-green-200' },
        no: { icon: XCircle, label: 'Nein', activeClass: 'bg-red-600 hover:bg-red-700 text-white', inactiveClass: 'bg-red-50 text-red-700 border-red-200' },
        maybe: { icon: HelpCircle, label: 'Vielleicht', activeClass: 'bg-yellow-500 hover:bg-yellow-600 text-white', inactiveClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    };

    const { icon: Icon, label, activeClass, inactiveClass } = config[status];

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={cn("gap-1.5 flex-1 sm:flex-none", isActive ? activeClass : inactiveClass)}
        >
            <Icon className="h-4 w-4" />
            {label}
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
        <div className="flex flex-col px-4 py-3 hover:bg-muted/20 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon className={cn("h-4 w-4 flex-shrink-0", color)} />
                    <div className="min-w-0">
                        <span className="text-sm font-medium truncate block">{userName}</span>
                        {!isEditing && attendance.comment && (
                            <span className="text-xs text-muted-foreground truncate block">
                                {attendance.comment}
                            </span>
                        )}
                    </div>
                </div>

                {isAdmin && (
                    <div className="flex gap-0.5 flex-shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onStatusChange('yes')} disabled={disabled}>
                            <CheckCircle className="h-3.5 w-3.5 text-success" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onStatusChange('no')} disabled={disabled}>
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onStatusChange('maybe')} disabled={disabled}>
                            <HelpCircle className="h-3.5 w-3.5 text-yellow-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(!isEditing)} disabled={disabled} title="Kommentar bearbeiten">
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </div>
                )}
            </div>

            {isAdmin && isEditing && (
                <div className="flex gap-2 mt-2 pl-7">
                    <Input
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Kommentar eingeben..."
                        className="flex-1 h-8 text-sm"
                    />
                    <Button size="sm" onClick={handleSaveComment} disabled={disabled}>OK</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>✕</Button>
                </div>
            )}
        </div>
    );
}

export default AttendanceSection;
