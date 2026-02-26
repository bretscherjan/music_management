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
import { Calendar, Download, Copy, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { createEvents } from 'ics';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText } from 'lucide-react';
import type { Event } from '@/types';
import { getCategoryLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PdfExportDialog } from '@/components/ui/PdfExportDialog';
import { getAutoTableStyles, addJsPdfTitle, type PdfOptions } from '@/utils/pdfTheme';

export function CalendarExportDialog({ events }: { events: Event[] }) {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Initialize selection when events change
    useEffect(() => {
        setSelectedIds(new Set(events.map(e => e.id)));
    }, [events]);

    const handleToggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        setSelectedIds(new Set(events.map(e => e.id)));
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    // Dynamic Calendar URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
    const calendarUrl = user?.calendarToken
        ? `${apiUrl}/calendar/${user.calendarToken}`.replace('http', 'webcal')
        : '';

    const handleCopyLink = () => {
        if (!calendarUrl) return;
        navigator.clipboard.writeText(calendarUrl);
        setCopied(true);
        toast.success('Link kopiert');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPdf = (opts: PdfOptions) => {
        const eventsToExport = events.filter(e => selectedIds.has(e.id));

        if (!eventsToExport.length) {
            toast.error('Bitte wähle mindestens einen Termin aus');
            return;
        }

        const doc = new jsPDF();

        const sortedEvents = [...eventsToExport].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const startY = addJsPdfTitle(doc, 'Terminübersicht', null, opts);

        autoTable(doc, {
            startY,
            head: [['Datum', 'Zeit', 'Titel', 'Ort', 'Kategorie']],
            body: sortedEvents.map(e => [
                new Date(e.date).toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
                `${e.startTime} - ${e.endTime}`,
                e.title,
                e.location || '-',
                getCategoryLabel(e.category)
            ]),
            ...getAutoTableStyles(),
            ...(opts.showPageNumbers && {
                didDrawPage: (data: any) => {
                    const pageCount = (doc as any).internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(
                        `Seite ${data.pageNumber} von ${pageCount}`,
                        doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 8,
                        { align: 'center' }
                    );
                }
            }),
        });

        doc.save('musig_elgg_termine.pdf');
        toast.success('PDF Download gestartet');
    };

    const handleDownloadIcs = async () => {
        const eventsToExport = events.filter(e => selectedIds.has(e.id));

        if (!eventsToExport.length) {
            toast.error('Bitte wähle mindestens einen Termin aus');
            return;
        }

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
                uid: `event-${event.id}@musig-elgg.ch`, // Stable UID for updates
            };
        });

        createEvents(icsEvents, (error, value) => {
            if (error) {
                console.error(error);
                toast.error('Fehler beim Erstellen der Datei');
                return;
            }
            const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
            saveAs(blob, "musig_elgg_termine.ics");
            toast.success(`${eventsToExport.length} Termine exportiert`);
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Kalender Export
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Kalender Export</DialogTitle>
                    <DialogDescription>
                        Abonniere den Kalender oder exportiere ausgewählte Termine.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Dynamic Subscription */}
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                        <Label className="flex items-center gap-2">
                            <span className="font-semibold">Automatische Synchronisation (Empfohlen)</span>
                            <Badge variant="outline" className="text-[10px] h-5">Live Update</Badge>
                        </Label>
                        <div className="text-xs text-muted-foreground mb-2">
                            Abonniere diesen Link für automatische Updates in deinem Kalender.
                        </div>
                        <div className="flex items-center space-x-2">
                            <Input
                                readOnly
                                value={calendarUrl}
                                className="font-mono text-xs bg-background"
                            />
                            <Button size="icon" variant="secondary" onClick={handleCopyLink}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Manueller Export</span>
                        </div>
                    </div>

                    {/* Static Download with Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Termine auswählen ({selectedIds.size}/{events.length})</Label>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleSelectAll}>
                                    Alle
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleDeselectAll}>
                                    Keine
                                </Button>
                            </div>
                        </div>

                        <div className="border rounded-md max-h-[200px] overflow-y-auto p-2 space-y-1 bg-background">
                            {events.map(event => (
                                <div key={event.id} className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => handleToggleSelect(event.id)}>
                                    <Checkbox
                                        checked={selectedIds.has(event.id)}
                                        onCheckedChange={() => handleToggleSelect(event.id)}
                                        id={`event-${event.id}`}
                                        className="mt-1"
                                    />
                                    <div className="grid gap-0.5 leading-none cursor-pointer flex-1">
                                        <label
                                            htmlFor={`event-${event.id}`}
                                            className="text-sm font-medium leading-none cursor-pointer"
                                        >
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
                                <div className="text-center text-sm text-muted-foreground py-4">
                                    Keine Termine verfügbar
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
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
