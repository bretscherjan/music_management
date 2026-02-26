import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/api';

interface FlyerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flyer?: any | null; // Keep it flexible for now
}

export function FlyerDialog({ open, onOpenChange }: FlyerDialogProps) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [activeFrom, setActiveFrom] = useState('');
    const [activeTo, setActiveTo] = useState('');
    const [active, setActive] = useState(true);
    const [showOnHomePage, setShowOnHomePage] = useState(false);
    const [position, setPosition] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setTitle('');
            setDescription('');
            setActiveFrom('');
            setActiveTo('');
            setActive(true);
            setShowOnHomePage(false);
            setPosition(0);
            setFile(null);
            setPreview(null);
        }
    }, [open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                setPreview(URL.createObjectURL(selectedFile));
            } else {
                setPreview(null);
            }
        }
    };

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            return cmsService.createFlyer(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flyers'] });
            toast.success('Flyer hochgeladen');
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Ein Fehler ist aufgetreten');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('activeFrom', activeFrom);
        formData.append('activeTo', activeTo);
        formData.append('active', String(active));
        formData.append('showOnHomePage', String(showOnHomePage));
        formData.append('position', String(position));
        formData.append('image', file);

        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Flyer hinzufügen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titel</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung / Text (optional)</Label>
                        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Info zur Werbung..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="from">Aktiv von (optional)</Label>
                            <Input id="from" type="date" value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="to">Aktiv bis (optional)</Label>
                            <Input id="to" type="date" value={activeTo} onChange={(e) => setActiveTo(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image">Datei (Bild oder PDF)</Label>
                        <Input id="image" type="file" onChange={handleFileChange} accept="image/*,application/pdf" required />
                        {preview && (
                            <div className="mt-2 border rounded p-1 bg-muted max-h-40 overflow-hidden">
                                <img src={getMediaUrl(preview)} alt="Preview" className="h-full w-auto mx-auto object-contain" />
                            </div>
                        )}
                        {file && file.type === 'application/pdf' && (
                            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                                <span className="p-2 bg-muted rounded border w-full text-center">PDF: {file.name}</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="active">Aktiv</Label>
                            <Switch id="active" checked={active} onCheckedChange={setActive} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="home">Auf Startseite anzeigen</Label>
                                <p className="text-[10px] text-muted-foreground italic">Erscheint im Werbung-Grid auf Home</p>
                            </div>
                            <Switch id="home" checked={showOnHomePage} onCheckedChange={setShowOnHomePage} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">Position (Sortierung)</Label>
                            <Input id="position" type="number" value={position} onChange={(e) => setPosition(parseInt(e.target.value))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button type="submit" disabled={mutation.isPending || !file}>
                            Speichern
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
