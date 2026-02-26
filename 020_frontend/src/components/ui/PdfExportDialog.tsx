import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2 } from 'lucide-react';
import { DEFAULT_PDF_OPTIONS, type PdfOptions } from '@/utils/pdfTheme';

interface PdfExportDialogProps {
    /** The button/element that opens the dialog */
    trigger?: React.ReactNode;
    /** Dialog title (default: "PDF exportieren") */
    title?: string;
    /** Short description shown below the title */
    description?: string;
    /** Called when user clicks "Exportieren". Return a Promise for loading state. */
    onExport: (opts: PdfOptions) => void | Promise<void>;
    /** External loading state (e.g. from useMutation) */
    isLoading?: boolean;
}

const OPTIONS_CONFIG = [
    { key: 'showAssocName'   as const, label: 'Vereinsname',  hint: 'Musig Elgg' },
    { key: 'showDocTitle'    as const, label: 'Dokumentname', hint: 'im Kopfbereich' },
    { key: 'showDate'        as const, label: 'Datum',        hint: 'Erstellungsdatum' },
    { key: 'showPageNumbers' as const, label: 'Seitenzahl',   hint: 'Seite X von Y' },
];

export function PdfExportDialog({
    trigger,
    title = 'PDF exportieren',
    description = 'Wähle die Elemente, die im PDF erscheinen sollen.',
    onExport,
    isLoading = false,
}: PdfExportDialogProps) {
    const [open, setOpen]   = useState(false);
    const [opts, setOpts]   = useState<PdfOptions>(DEFAULT_PDF_OPTIONS);
    const [busy, setBusy]   = useState(false);

    const toggle = (key: keyof PdfOptions) =>
        setOpts(prev => ({ ...prev, [key]: !prev[key] }));

    const handleExport = async () => {
        setBusy(true);
        try {
            await onExport(opts);
            setOpen(false);
        } finally {
            setBusy(false);
        }
    };

    const loading = busy || isLoading;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        PDF Export
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pb-2">
                        Kopf- und Fusszeile
                    </p>
                    {OPTIONS_CONFIG.map(({ key, label, hint }) => (
                        <div key={key} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggle(key)}>
                            <Checkbox
                                id={`pdf-opt-${key}`}
                                checked={opts[key]}
                                onCheckedChange={() => toggle(key)}
                            />
                            <div className="flex-1">
                                <Label htmlFor={`pdf-opt-${key}`} className="cursor-pointer font-medium">
                                    {label}
                                </Label>
                                <p className="text-[11px] text-muted-foreground">{hint}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                        Abbrechen
                    </Button>
                    <Button onClick={handleExport} disabled={loading}>
                        {loading
                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exportieren…</>
                            : <><FileDown className="h-4 w-4 mr-2" />Exportieren</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
