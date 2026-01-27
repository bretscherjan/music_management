import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Check, X, HelpCircle, Save, CheckCircle2 } from 'lucide-react';
import type { VerificationListItem, VerificationStatus } from '@/types';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface VerificationSectionProps {
    eventId: number;
    eventDate: string;
}

export function VerificationSection({ eventId, eventDate }: VerificationSectionProps) {
    const queryClient = useQueryClient();
    const [openRegisters, setOpenRegisters] = useState<string[]>([]);
    const [verifications, setVerifications] = useState<Record<number, VerificationStatus>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch Data
    const { data, isLoading } = useQuery({
        queryKey: ['verification-list', eventId],
        queryFn: () => eventService.getVerificationList(eventId),
    });

    // Initialize local state when data loads
    useEffect(() => {
        if (data) {
            const initialVerifications: Record<number, VerificationStatus> = {};
            data.list.forEach(item => {
                initialVerifications[item.user.id] = item.smartStatus;
            });
            setVerifications(initialVerifications);
        }
    }, [data]);

    const mutation = useMutation({
        mutationFn: (updates: { userId: number; status: VerificationStatus }[]) =>
            eventService.verifyAttendance(eventId, { verifications: updates }),
        onSuccess: () => {
            toast.success('Anwesenheiten gespeichert');
            queryClient.invalidateQueries({ queryKey: ['verification-list', eventId] });
            queryClient.invalidateQueries({ queryKey: ['event', eventId] }); // update summary
            setHasChanges(false);
        },
        onError: () => toast.error('Fehler beim Speichern'),
    });

    const toggleRegister = (registerName: string) => {
        setOpenRegisters(prev =>
            prev.includes(registerName)
                ? prev.filter(r => r !== registerName)
                : [...prev, registerName]
        );
    };

    const handleStatusChange = (userId: number, status: VerificationStatus) => {
        setVerifications(prev => ({ ...prev, [userId]: status }));
        setHasChanges(true);
    };

    const handleMarkAllPresent = (registerName: string, items: VerificationListItem[]) => {
        const newVerifications = { ...verifications };
        items.forEach(item => {
            newVerifications[item.user.id] = 'PRESENT';
        });
        setVerifications(newVerifications);
        setHasChanges(true);
        toast.info(`Alle in ${registerName} als anwesend markiert`);
    };

    const handleSave = () => {
        const updates = Object.entries(verifications).map(([userId, status]) => ({
            userId: parseInt(userId),
            status,
        }));
        mutation.mutate(updates);
    };

    if (isLoading) return <div>Lade Liste...</div>;
    if (!data) return null;

    // Helper to calculate present count for badge
    const getPresentCount = (items: VerificationListItem[]) => {
        return items.filter(i => verifications[i.user.id] === 'PRESENT').length;
    };


    return (
        <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        Anwesenheitskontrolle ({formatDate(eventDate)})
                    </CardTitle>
                    {hasChanges && (
                        <Button onClick={handleSave} disabled={mutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {mutation.isPending ? 'Speichert...' : 'Speichern'}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(data.grouped).map(([registerName, items]) => {
                    const isOpen = openRegisters.includes(registerName);
                    const presentCount = getPresentCount(items);
                    const totalCount = items.length;

                    return (
                        <div key={registerName} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                            {/* Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleRegister(registerName)}
                            >
                                <div className="flex items-center gap-3">
                                    {isOpen ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                                    <span className="font-semibold text-lg">{registerName}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-gray-100">
                                        {presentCount} / {totalCount} Anwesend
                                    </Badge>
                                </div>
                            </div>

                            {/* Content */}
                            {isOpen && (
                                <div className="border-t p-4 bg-gray-50/50">
                                    <div className="flex justify-end mb-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAllPresent(registerName, items);
                                            }}
                                        >
                                            Alle markieren
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {items.map((item) => {
                                            const currentStatus = verifications[item.user.id];
                                            const selfStatus = item.attendance?.status;

                                            return (
                                                <div key={item.user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-white rounded-md border text-sm">
                                                    {/* User Info */}
                                                    <div className="flex items-center gap-3 min-w-[200px]">
                                                        {item.user.profilePicture ? (
                                                            <img
                                                                src={item.user.profilePicture}
                                                                alt={`${item.user.firstName} ${item.user.lastName}`}
                                                                className="h-8 w-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                                                {item.user.firstName[0]}{item.user.lastName[0]}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{item.user.firstName} {item.user.lastName}</div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                Selbst:
                                                                <span className={
                                                                    selfStatus === 'yes' ? 'text-green-600 font-bold' :
                                                                        selfStatus === 'no' ? 'text-red-600' :
                                                                            'text-gray-500'
                                                                }>
                                                                    {selfStatus === 'yes' ? 'Ja' : selfStatus === 'no' ? 'Nein' : 'Keine'}
                                                                </span>
                                                                {item.attendance?.comment && (
                                                                    <span title={item.attendance.comment} className="cursor-help text-gray-400">📝</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => handleStatusChange(item.user.id, 'PRESENT')}
                                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all text-xs font-medium ${currentStatus === 'PRESENT'
                                                                ? 'bg-white text-green-700 shadow-sm ring-1 ring-green-200'
                                                                : 'text-gray-500 hover:bg-gray-200'
                                                                }`}
                                                            title="Anwesend"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Anwesend</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(item.user.id, 'EXCUSED')}
                                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all text-xs font-medium ${currentStatus === 'EXCUSED'
                                                                ? 'bg-white text-yellow-700 shadow-sm ring-1 ring-yellow-200'
                                                                : 'text-gray-500 hover:bg-gray-200'
                                                                }`}
                                                            title="Entschuldigt"
                                                        >
                                                            <HelpCircle className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Entschuldigt</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(item.user.id, 'UNEXCUSED')}
                                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all text-xs font-medium ${currentStatus === 'UNEXCUSED'
                                                                ? 'bg-white text-red-700 shadow-sm ring-1 ring-red-200'
                                                                : 'text-gray-500 hover:bg-gray-200'
                                                                }`}
                                                            title="Unentschuldigt"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Unentsch.</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
