import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { useCan } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { registerService } from '@/services/registerService';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2 } from 'lucide-react';
import type { CreateEventDto } from '@/types';


export function CreateEventPage() {
    const can = useCan();
    const canReadRegisters = can('registers:read');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const queryClient = useQueryClient();
    // const { user } = useAuth(); // User defaults removed
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State - default deadline 48 hours (2 days) before event
    const [formData, setFormData] = useState<Partial<CreateEventDto> & { defaultAttendanceStatus?: string }>(() => {
        return {
            title: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '20:00',
            endTime: '22:00',
            location: '',
            category: 'rehearsal',
            visibility: 'all',
            description: '',
            responseDeadlineHours: 48, // 2 days before by default
            isRecurring: false,
            defaultAttendanceStatus: 'none',
            setlistEnabled: false,
            isPublic: false,
            targetRegisters: [] as number[],
        };
    });



    // Recurrence State
    const [recurrenceFreq, setRecurrenceFreq] = useState('WEEKLY');
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');

    // Fetch event if in edit mode
    const { data: eventData } = useQuery({
        queryKey: ['event', id],
        queryFn: () => eventService.getById(parseInt(id!)),
        enabled: isEditMode,
    });

    // Fetch Registers
    const { data: registers = [] } = useQuery({
        queryKey: ['registers'],
        queryFn: registerService.getAll,
        enabled: canReadRegisters,
    });

    // Populate form when data is loaded
    useEffect(() => {
        if (eventData) {
            setFormData({
                title: eventData.title,
                date: new Date(eventData.date).toISOString().split('T')[0],
                startTime: eventData.startTime.slice(0, 5),
                endTime: eventData.endTime.slice(0, 5),
                location: eventData.location || '',
                category: eventData.category,
                visibility: eventData.visibility,
                description: eventData.description || '',
                responseDeadlineHours: eventData.responseDeadlineHours || 48,
                isRecurring: eventData.isRecurring,
                defaultAttendanceStatus: 'none',
                setlistEnabled: eventData.setlistEnabled || false,
                isPublic: eventData.isPublic ?? false,
                targetRegisters: eventData.targetRegisters?.map((r: any) => r.id) || [],
            });

            if (eventData.isRecurring && eventData.recurrenceRule) {
                const parts = eventData.recurrenceRule.split(';');
                const freq = parts.find((p: string) => p.startsWith('FREQ='))?.split('=')[1];
                const interval = parts.find((p: string) => p.startsWith('INTERVAL='))?.split('=')[1];

                if (freq) setRecurrenceFreq(freq);
                if (interval) setRecurrenceInterval(parseInt(interval));
            }
        }
    }, [eventData]);

    const createMutation = useMutation({
        mutationFn: eventService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            navigate('/member/events');
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Erstellen des Events');
            setIsLoading(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => eventService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['event', id] });
            navigate(`/member/events/${id}`);
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Aktualisieren des Events');
            setIsLoading(false);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Build recurrence rule if recurring
            let rule = null;
            if (formData.isRecurring) {
                rule = `FREQ=${recurrenceFreq};INTERVAL=${recurrenceInterval}`;
                if (recurrenceEndDate) {
                    const untilDate = new Date(recurrenceEndDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    rule += `;UNTIL=${untilDate}`;
                }
            }

            if (isEditMode) {
                await updateMutation.mutateAsync({
                    id: parseInt(id!),
                    data: {
                        ...formData,
                        recurrenceRule: rule || undefined,
                        defaultAttendanceStatus: undefined, // Don't send this check on update
                    }
                });
            } else {
                await createMutation.mutateAsync({
                    ...formData as CreateEventDto,
                    recurrenceRule: rule || undefined,
                });
            }
        } catch (err) {
            // Error handled in onError
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 gap-2">
                <ChevronLeft className="h-4 w-4" />
                Zurück
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? 'Termin bearbeiten' : 'Neuen Termin erstellen'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Titel *</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="z.B. Probe, Konzert, Sitzung"
                            />
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Datum *</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Startzeit *</Label>
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">Endzeit *</Label>
                                <Input
                                    id="endTime"
                                    name="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label htmlFor="location">Ort</Label>
                            <Input
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="z.B. Gemeindesaal"
                            />
                        </div>



                        {/* Response Deadline */}
                        <div className="space-y-2">
                            <Label htmlFor="responseDeadlineHours">Rückmeldung bis *</Label>
                            <select
                                id="responseDeadlineHours"
                                name="responseDeadlineHours"
                                value={formData.responseDeadlineHours}
                                onChange={(e) => setFormData(prev => ({ ...prev, responseDeadlineHours: parseInt(e.target.value) }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="1">1 Stunde vorher</option>
                                <option value="2">2 Stunden vorher</option>
                                <option value="3">3 Stunden vorher</option>
                                <option value="5">5 Stunden vorher</option>
                                <option value="12">12 Stunden vorher</option>
                                <option value="24">1 Tag vorher</option>
                                <option value="48">2 Tage vorher</option>
                                <option value="72">3 Tage vorher</option>
                                <option value="120">5 Tage vorher</option>
                                <option value="168">1 Woche vorher</option>
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Nach dieser Frist können nur noch Administratoren die Anwesenheit ändern.
                            </p>
                        </div>

                        {/* Category & Visibility Settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Kategorie</Label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="rehearsal">Probe</option>
                                    <option value="performance">Auftritt</option>
                                    <option value="other">Sonstiges</option>
                                </select>
                            </div>

                            {/* Public Visibility Toggle */}
                            <div className="flex items-end pb-2">
                                <div className="flex items-center space-x-2 h-10"> {/* Match input height */}
                                    <Switch
                                        id="isPublic"
                                        checked={!!formData.isPublic}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                                    />
                                    <Label htmlFor="isPublic" className="cursor-pointer">
                                        Öffentlich anzeigen (Website)
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Internal Visibility / Register Restriction */}
                        {canReadRegisters && (
                        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                            <Label className="font-semibold">Sichtbarkeit für Mitglieder</Label>
                            <p className="text-sm text-muted-foreground">
                                Standardmässig sind Termine für alle Mitglieder sichtbar. Hier können Sie die Sichtbarkeit einschränken.
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                {registers.map((reg: any) => {
                                    const isSelected = (formData.targetRegisters as number[])?.includes(reg.id);
                                    return (
                                        <div key={reg.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`reg-${reg.id}`}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => {
                                                        const current = prev.targetRegisters as number[] || [];
                                                        if (checked) {
                                                            return { ...prev, targetRegisters: [...current, reg.id] };
                                                        } else {
                                                            return { ...prev, targetRegisters: current.filter(id => id !== reg.id) };
                                                        }
                                                    });
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor={`reg-${reg.id}`} className="text-sm cursor-pointer">
                                                {reg.name}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {(formData.targetRegisters as number[])?.length > 0
                                    ? "Nur für ausgewählte Register sichtbar (+ Admins)."
                                    : "Für alle Mitglieder sichtbar."}
                            </p>
                        </div>
                        )}

                        {/* Default Attendance Status - ONLY SHOW IN CREATE MODE */}
                        {!isEditMode && (
                            <div className="space-y-2">
                                <Label htmlFor="defaultAttendanceStatus">Standard-Anwesenheitsstatus für alle Mitglieder</Label>
                                <select
                                    id="defaultAttendanceStatus"
                                    name="defaultAttendanceStatus"
                                    value={formData.defaultAttendanceStatus}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="none">Keine automatische Eintragung</option>
                                    <option value="yes">Alle als zugesagt eintragen</option>
                                    <option value="no">Alle als abgesagt eintragen</option>
                                    <option value="maybe">Alle als enthalten eintragen</option>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Bestimmt, ob alle aktiven Mitglieder automatisch mit einem Status eingetragen werden.
                                </p>
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Beschreibung</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Details zum Termin..."
                                rows={4}
                            />
                        </div>

                        {/* Setlist/Ablauf Toggle */}
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="setlistEnabled"
                                    name="setlistEnabled"
                                    checked={formData.setlistEnabled}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="setlistEnabled" className="font-semibold cursor-pointer">
                                        Ablauf/Programm planen?
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Aktivieren, um Noten, Pausen und Ablauf-Punkte für diesen Termin zu verwalten.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recurrence Settings */}
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isRecurring"
                                    name="isRecurring"
                                    checked={formData.isRecurring}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="isRecurring" className="font-semibold cursor-pointer">
                                    Serientermin wiederholen
                                </Label>
                            </div>

                            {formData.isRecurring && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="recurrenceFreq">Wiederholung</Label>
                                        <select
                                            id="recurrenceFreq"
                                            value={recurrenceFreq}
                                            onChange={(e) => setRecurrenceFreq(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="WEEKLY">Wöchentlich</option>
                                            <option value="DAILY">Täglich</option>
                                            <option value="MONTHLY">Monatlich</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="recurrenceInterval">Intervall</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">Alle</span>
                                            <Input
                                                id="recurrenceInterval"
                                                type="number"
                                                min="1"
                                                max="52"
                                                value={recurrenceInterval}
                                                onChange={(e) => setRecurrenceInterval(parseInt(e.target.value))}
                                                className="w-20"
                                            />
                                            <span className="text-sm">
                                                {recurrenceFreq === 'WEEKLY' ? 'Wochen' :
                                                    recurrenceFreq === 'DAILY' ? 'Tage' : 'Monate'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="recurrenceEndDate">Endet am (Optional)</Label>
                                        <Input
                                            id="recurrenceEndDate"
                                            type="date"
                                            value={recurrenceEndDate}
                                            onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? 'Speichern' : 'Termin erstellen'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
