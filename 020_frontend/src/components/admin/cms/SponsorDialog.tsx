import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { Sponsor } from '@/services/cmsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface SponsorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sponsor: Sponsor | null;
}

export function SponsorDialog({ open, onOpenChange, sponsor }: SponsorDialogProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [active, setActive] = useState(true);
    const [position, setPosition] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (sponsor) {
            setName(sponsor.name);
            setWebsiteUrl(sponsor.websiteUrl || '');
            setActive(sponsor.active);
            setPosition(sponsor.position);
            setPreview(sponsor.logoUrl);
        } else {
            setName('');
            setWebsiteUrl('');
            setActive(true);
            setPosition(0);
            setPreview(null);
        }
        setFile(null);
    }, [sponsor, open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (sponsor) {
                return cmsService.updateSponsor(sponsor.id, formData);
            } else {
                return cmsService.createSponsor(formData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sponsors'] });
            toast.success(sponsor ? 'Sponsor aktualisiert' : 'Sponsor erstellt');
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Ein Fehler ist aufgetreten');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('websiteUrl', websiteUrl);
        formData.append('active', String(active));
        formData.append('position', String(position));
        if (file) {
            formData.append('logo', file);
        }

        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{sponsor ? 'Sponsor bearbeiten' : 'Neuen Sponsor hinzufügen'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="website">Website URL (optional)</Label>
                        <Input id="website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="logo">Logo</Label>
                        <Input id="logo" type="file" onChange={handleFileChange} accept="image/*" required={!sponsor} />
                        {preview && (
                            <div className="mt-2 p-2 border rounded bg-muted">
                                <img src={preview} alt="Preview" className="h-20 w-auto mx-auto object-contain" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="active">Aktiv</Label>
                        <Switch id="active" checked={active} onCheckedChange={setActive} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="position">Position (Sortierung)</Label>
                        <Input id="position" type="number" value={position} onChange={(e) => setPosition(parseInt(e.target.value))} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {sponsor ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
