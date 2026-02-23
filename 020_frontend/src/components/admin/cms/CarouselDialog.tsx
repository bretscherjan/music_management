import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { CarouselItem } from '@/services/cmsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CarouselDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: CarouselItem | null;
}

export function CarouselDialog({ open, onOpenChange, item }: CarouselDialogProps) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [active, setActive] = useState(true);
    const [position, setPosition] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (item) {
            setTitle(item.title || '');
            setDescription(item.description || '');
            setLink(item.link || '');
            setActive(item.active);
            setPosition(item.position);
            setPreview(item.imageUrl);
        } else {
            setTitle('');
            setDescription('');
            setLink('');
            setActive(true);
            setPosition(0);
            setPreview(null);
        }
        setFile(null);
    }, [item, open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (item) {
                return cmsService.updateCarouselItem(item.id, formData);
            } else {
                return cmsService.createCarouselItem(formData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carousel'] });
            toast.success(item ? 'Eintrag aktualisiert' : 'Eintrag erstellt');
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Ein Fehler ist aufgetreten');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('link', link);
        formData.append('active', String(active));
        formData.append('position', String(position));
        if (file) {
            formData.append('image', file);
        }

        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item ? 'Eintrag bearbeiten' : 'Neues Bild hinzufügen'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titel</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="link">Link URL (optional)</Label>
                        <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image">Bild</Label>
                        <Input id="image" type="file" onChange={handleFileChange} accept="image/*" required={!item} />
                        {preview && (
                            <div className="mt-2 border rounded overflow-hidden aspect-video">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="active">Aktiv</Label>
                        <Switch id="active" checked={active} onCheckedChange={setActive} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input id="position" type="number" value={position} onChange={(e) => setPosition(parseInt(e.target.value))} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {item ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
