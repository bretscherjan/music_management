import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Calendar, Download, Copy, Check, RefreshCw, Bell, Info, FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { createEvents } from 'ics';
import { saveAs } from 'file-saver';
import type { Event, EventCategory } from '@/types';
import type { CalendarPreferences } from '@/types';
import { DEFAULT_CALENDAR_PREFS } from '@/types';
import { getCategoryLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PdfExportDialog } from '@/components/ui/PdfExportDialog';
import { getAutoTableStyles, addJsPdfTitle, type PdfOptions } from '@/utils/pdfTheme';
import { calendarService } from '@/services/calendarService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
    { value: 'performance', label: 'Auftritte' },
    { value: 'rehearsal', label: 'Proben' },
    { value: 'other', label: 'Sonstiges' },
];

const REMINDER_OPTIONS = [
    { value: '0', label: 'Keine Erinnerung' },
    { value: '15', label: '15 Minuten vorher' },
    { value: '30', label: '30 Minuten vorher' },
    { value: '60', label: '1 Stunde vorher' },
    { value: '120', label: '2 Stunden vorher' },
    { value: '1440', label: '1 Tag vorher' },
];

function buildCalendarUrl(apiUrl: string, token: string, prefs: CalendarPreferences): string {
    // Resolve relative API URLs (e.g. /api) to an absolute URL for copy/paste into calendar apps.
    const normalizedApiUrl = /^https?:\/\//i.test(apiUrl)
        ? apiUrl
        : `${window.location.origin}${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}`;

    const base = `${normalizedApiUrl}/calendar/${token}`;
    const params = new URLSearchParams();

    if (prefs.onlyConfirmed) params.set('onlyConfirmed', 'true');
    if (prefs.categories.length > 0) params.set('categories', prefs.categories.join(','));
    if (prefs.reminderMinutes > 0) params.set('reminderMinutes', String(prefs.reminderMinutes));

    const query = params.toString();
    return query ? `${base}?${query}` : base;
}

export function CalendarExportDialog({ events }: { events: Event[] }) {
    const { user, refreshUser } = useAuth();
    const [copied, setCopied] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [prefs, setPrefs] = useState<CalendarPreferences>(DEFAULT_CALENDAR_PREFS);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [rotatingToken, setRotatingToken] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [localToken, setLocalToken] = useState<string | undefined>(user?.calendarToken);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingIds = events.filter(e => new Date(e.date) >= today).map(e => e.id);
    const pastIds = events.filter(e => new Date(e.date) < today).map(e => e.id);

    useEffect(() => {
        setSelectedIds(new Set(events.filter(e => new Date(e.date) >= today).map(e => e.id)));
    }, [events]);

    useEffect(() => {
        setLocalToken(user?.calendarToken);
    }, [user?.calendarToken]);

    useEffect(() => {
        calendarService.getPreferences()
            .then(p => setPrefs(p))
            .catch(() => { /* use defaults silently */ });
    }, []);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
    const calendarUrl = localToken ? buildCalendarUrl(apiUrl, localToken, prefs) : '';

    const handleCopyLink = () => {
        if (!calendarUrl) return;
        navigator.clipboard.writeText(calendarUrl);
        setCopied(true);
        toast.success('Link kopiert');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleCategory = (cat: EventCategory) => {
        setPrefs(prev => {
            const has = prev.categories.includes(cat);
            return {
                ...prev,
                categories: has
                    ? prev.categories.filter(c => c !== cat)
                    : [...prev.categories, cat],
            };
        });
    };

    const handleSavePrefs = async () => {
        setSavingPrefs(true);
        try {
            const saved = await calendarService.savePreferences(prefs);
            setPrefs(saved);
            toast.success('Einstellungen gespeichert');
        } catch {
            toast.error('Fehler beim Speichern');
        } finally {
            setSavingPrefs(false);
        }
    };

    const handleRotateToken = async () => {
        if (!confirmReset) {
            setConfirmReset(true);
            return;
        }
        setRotatingToken(true);
        try {
            const { calendarToken } = await calendarService.rotateToken();
            setLocalToken(calendarToken);
            await refreshUser();
            setConfirmReset(false);
            toast.success('Kalender-Link wurde zurückgesetzt');
        } catch {
            toast.error('Fehler beim Zurücksetzen');
        } finally {
            setRotatingToken(false);
        }
    };

    const handleToggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleDownloadPdf = (opts: PdfOptions) => {
        const eventsToExport = events.filter(e => selectedIds.has(e.id));
        if (!eventsToExport.length) { toast.error('Bitte wähle mindestens einen Termin aus'); return; }

        const doc = new jsPDF();
        const sortedEvents = [...eventsToExport].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const startY = addJsPdfTitle(doc, 'Terminübersicht', null, opts);

        autoTable(doc, {
            startY,
            head: [['Datum', 'Zeit', 'Titel', 'Ort', 'Kategorie']],
            body: sortedEvents.map(e => [
                new Date(e.date).toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
                `${e.startTime} - ${e.endTime}`,
                e.title,
                e.location || '-',
                getCategoryLabel(e.category),
            ]),
            ...getAutoTableStyles(),
            ...(opts.showPageNumbers && {
                didDrawPage: (data: any) => {
                    const pageCount = (doc as any).internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`Seite ${data.pageNumber} von ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 8, { align: 'center' });
                },
            }),
        });

        doc.save('musig_elgg_termine.pdf');
        toast.success('PDF Download gestartet');
    };

    const handleDownloadIcs = async () => {
        const eventsToExport = events.filter(e => selectedIds.has(e.id));
        if (!eventsToExport.length) { toast.error('Bitte wähle mindestens einen Termin aus'); return; }

        const icsEvents = eventsToExport.map(event => {
            const start = new Date(event.date);
            const [startH, startM] = event.startTime.split(':').map(Number);
            const [endH, endM] = event.endTime.split(':').map(Number);

            return {
                start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), startH, startM] as [number, number, number, number, number],
                end: [start.getFullYear(), start.getMonth() + 1, start.getDate(), endH, endM] as [number, number, number, number, number],
                title: event.title,
                description: event.description || '',
                location: event.location || '',
                status: 'CONFIRMED' as const,
                busyStatus: 'BUSY' as const,
                uid: `event-${event.id}@musig-elgg.ch`,
            };
        });

        createEvents(icsEvents, (error, value) => {
            if (error) { toast.error('Fehler beim Erstellen der Datei'); return; }
            const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
            saveAs(blob, 'musig_elgg_termine.ics');
            toast.success(`${eventsToExport.length} Termine exportiert`);
        });
    };

    return (
        <Dialog onOpenChange={open => { if (!open) setConfirmReset(false); }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Kalender Export
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Kalender Export</DialogTitle>
                    <DialogDescription>
                        Synchronisiere deinen persönlichen Kalender oder exportiere ausgewählte Termine.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">

                    {/* ── Sync Filters ── */}
                    <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border/40">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Synchronisationsfilter</p>
                            <Badge variant="outline" className="text-[10px] h-5">Live Update</Badge>
                        </div>

                        {/* Only confirmed */}
                        <div className="flex items-center justify-between">
                            <Label htmlFor="only-confirmed" className="text-sm cursor-pointer">
                                Nur Termine mit meiner Zusage
                            </Label>
                            <Switch
                                id="only-confirmed"
                                checked={prefs.onlyConfirmed}
                                onCheckedChange={v => setPrefs(p => ({ ...p, onlyConfirmed: v }))}
                            />
                        </div>

                        {/* Category filter */}
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Kategorien einschliessen</p>
                            <div className="flex flex-wrap gap-3">
                                {CATEGORY_OPTIONS.map(cat => (
                                    <div key={cat.value} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`cat-${cat.value}`}
                                            checked={prefs.categories.length === 0 || prefs.categories.includes(cat.value)}
                                            onCheckedChange={() => handleToggleCategory(cat.value)}
                                        />
                                        <label htmlFor={`cat-${cat.value}`} className="text-sm cursor-pointer">
                                            {cat.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {prefs.categories.length > 0 && (
                                <p className="text-[11px] text-muted-foreground">
                                    Nur: {prefs.categories.map(c => getCategoryLabel(c)).join(', ')}
                                </p>
                            )}
                        </div>

                        {/* Reminder */}
                        <div className="flex items-center gap-3">
                            <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Label className="text-sm shrink-0">Erinnerung</Label>
                            <Select
                                value={String(prefs.reminderMinutes)}
                                onValueChange={v => setPrefs(p => ({ ...p, reminderMinutes: parseInt(v, 10) }))}
                            >
                                <SelectTrigger className="h-8 text-sm flex-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REMINDER_OPTIONS.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Save prefs + webcal URL */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Input
                                readOnly
                                value={calendarUrl}
                                className="font-mono text-[11px] bg-background flex-1"
                            />
                            <Button
                                variant="secondary"
                                onClick={handleCopyLink}
                                title="Link kopieren"
                                className="w-full sm:w-auto"
                            >
                                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                Link kopieren
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button
                                onClick={handleSavePrefs}
                                disabled={savingPrefs}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {savingPrefs ? 'Speichern...' : 'Einstellungen speichern'}
                            </Button>

                            {confirmReset ? (
                                <div className="space-y-2">
                                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-[11px] text-destructive">
                                        <p className="font-semibold mb-1">Achtung: Link zurücksetzen</p>
                                        <p>Wenn du bestätigst, hat das sofort folgende Folgen:</p>
                                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                            <li>Der bisherige Kalender-Link ist sofort ungültig.</li>
                                            <li>Bestehende Kalender-Abos mit dem alten Link aktualisieren nicht mehr.</li>
                                            <li>Du musst danach den neuen Link in deinen Kalendern neu einfügen.</li>
                                        </ul>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="flex-1 text-xs"
                                            onClick={handleRotateToken}
                                            disabled={rotatingToken}
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            {rotatingToken ? '...' : 'Jetzt zurücksetzen'}
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-xs px-2" onClick={() => setConfirmReset(false)}>
                                            Abbruch
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={handleRotateToken}
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Link zurücksetzen
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* ── Help inset ── */}
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 space-y-1.5">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <Info className="h-4 w-4 shrink-0" />
                            <p className="text-xs font-semibold">Welcher Link ist richtig?</p>
                        </div>
                        <p className="text-[11px] text-blue-600 dark:text-blue-300 leading-relaxed">
                            Im Feld oben steht der normale Link mit <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">https://</code>.
                            Dieser funktioniert fast überall und ist die sichere Standardwahl.
                            Wenn deine Kalender-App ausdrücklich ein Abo-Link-Format verlangt, ersetze nur vorne
                            <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded ml-1">https://</code>
                            durch
                            <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded ml-1">webcal://</code>.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Manueller Export</span>
                        </div>
                    </div>

                    {/* ── Manual export ── */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Termine auswählen ({selectedIds.size}/{events.length})</Label>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setSelectedIds(new Set(upcomingIds))}>
                                    Bevorstehende
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setSelectedIds(new Set(pastIds))}>
                                    Vergangene
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setSelectedIds(new Set(events.map(e => e.id)))}>
                                    Alle
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setSelectedIds(new Set())}>
                                    Keine
                                </Button>
                            </div>
                        </div>

                        <div className="border rounded-xl max-h-[180px] overflow-y-auto p-2 space-y-1 bg-background">
                            {events.map(event => (
                                <div
                                    key={event.id}
                                    className="flex items-start space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                                    onClick={() => handleToggleSelect(event.id)}
                                >
                                    <Checkbox
                                        checked={selectedIds.has(event.id)}
                                        onCheckedChange={() => handleToggleSelect(event.id)}
                                        id={`event-${event.id}`}
                                        className="mt-1"
                                    />
                                    <div className="grid gap-0.5 leading-none cursor-pointer flex-1">
                                        <label htmlFor={`event-${event.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                            {event.title}
                                        </label>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span>{new Date(event.date).toLocaleDateString('de-CH')}</span>
                                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                {getCategoryLabel(event.category)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground py-4">Keine Termine verfügbar</div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <PdfExportDialog
                                trigger={
                                    <Button variant="outline" disabled={selectedIds.size === 0}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Als PDF
                                    </Button>
                                }
                                title="Terminübersicht exportieren"
                                description="Wähle die Elemente, die im PDF erscheinen sollen."
                                onExport={handleDownloadPdf}
                            />
                            <Button variant="outline" onClick={handleDownloadIcs} disabled={selectedIds.size === 0}>
                                <Download className="h-4 w-4 mr-2" />
                                Als .ics
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
