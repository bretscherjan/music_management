import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface FlyerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FlyerDialog({ open, onOpenChange }: FlyerDialogProps) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [activeFrom, setActiveFrom] = useState('');
    const [activeTo, setActiveTo] = useState('');
    const [active, setActive] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setTitle('');
            setActiveFrom('');
            setActiveTo('');
            setActive(true);
            setFile(null);
            setPreview(null);
        }
    }, [open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
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
        formData.append('activeFrom', activeFrom);
        formData.append('activeTo', activeTo);
        formData.append('active', String(active));
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
                        <Label htmlFor="image">Flyer-Bild</Label>
                        <Input id="image" type="file" onChange={handleFileChange} accept="image/*" required />
                        {preview && (
                            <div className="mt-2 border rounded p-1 bg-muted max-h-40 overflow-hidden">
                                <img src={preview} alt="Preview" className="h-full w-auto mx-auto object-contain" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="active">Aktiv</Label>
                        <Switch id="active" checked={active} onCheckedChange={setActive} />
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
