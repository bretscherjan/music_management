import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Loader2, CheckCircle, Info } from 'lucide-react';

type AttendanceDefault = 'yes' | 'no' | 'maybe' | 'none';

const attendanceOptions: { value: AttendanceDefault; label: string; description: string }[] = [
    { value: 'yes', label: 'Zugesagt', description: 'Alle Benutzer werden als zugesagt eingetragen' },
    { value: 'no', label: 'Abgesagt', description: 'Alle Benutzer werden als abgesagt eingetragen' },
    { value: 'maybe', label: 'Enthalten', description: 'Alle Benutzer werden als enthalten eingetragen' },
    { value: 'none', label: 'Keine automatische Erstellung', description: 'Keine Anwesenheitseinträge werden erstellt' },
];

export function SettingsPage() {
    const queryClient = useQueryClient();
    const [defaultAttendance, setDefaultAttendance] = useState<AttendanceDefault>('maybe');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: () => settingsService.getAll(),
    });

    const { mutate: updateSetting, isPending } = useMutation({
        mutationFn: ({ key, value }: { key: string; value: string }) =>
            settingsService.update(key, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        },
    });

    // Load current setting when data arrives
    useEffect(() => {
        if (settings?.defaultAttendanceStatus) {
            setDefaultAttendance(settings.defaultAttendanceStatus as AttendanceDefault);
        }
    }, [settings]);

    const handleSave = () => {
        updateSetting({ key: 'defaultAttendanceStatus', value: defaultAttendance });
    };

    const hasChanges = settings?.defaultAttendanceStatus !== defaultAttendance;

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Settings className="h-8 w-8" />
                    Einstellungen
                </h1>
                <p className="text-muted-foreground">
                    Verwalte die allgemeinen Vereins-Einstellungen
                </p>
            </div>

            {/* Default Attendance Setting */}
            <Card>
                <CardHeader>
                    <CardTitle>Standard-Anwesenheitsstatus</CardTitle>
                    <CardDescription>
                        Bestimmt welchen Anwesenheitsstatus alle aktiven Benutzer automatisch
                        erhalten, wenn ein neuer Termin erstellt wird.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Lädt Einstellungen...
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {attendanceOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${defaultAttendance === option.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:bg-muted/50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="defaultAttendance"
                                            value={option.value}
                                            checked={defaultAttendance === option.value}
                                            onChange={(e) => setDefaultAttendance(e.target.value as AttendanceDefault)}
                                            className="mt-1 h-4 w-4"
                                        />
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {option.description}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t">
                                <Button
                                    onClick={handleSave}
                                    disabled={isPending || !hasChanges}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Speichert...
                                        </>
                                    ) : (
                                        'Speichern'
                                    )}
                                </Button>

                                {saveSuccess && (
                                    <div className="flex items-center gap-1 text-sm text-success">
                                        <CheckCircle className="h-4 w-4" />
                                        Gespeichert
                                    </div>
                                )}
                            </div>

                            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                                <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                <p className="text-muted-foreground">
                                    Diese Einstellung gilt nur für <strong>neue</strong> Termine.
                                    Bestehende Termine werden nicht beeinflusst. Benutzer können
                                    ihren Status jederzeit selbst ändern.
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default SettingsPage;
