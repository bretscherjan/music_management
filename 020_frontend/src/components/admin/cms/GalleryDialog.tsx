import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { GalleryImage } from '@/services/cmsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { resolveMediaUrl } from '@/lib/api';

interface GalleryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    image?: GalleryImage | null;
}

export function GalleryDialog({ open, onOpenChange, image }: GalleryDialogProps) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [active, setActive] = useState(true);
    const [position, setPosition] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (image) {
            setTitle(image.title || '');
            setDescription(image.description || '');
            setCategory(image.category || '');
            setActive(image.active);
            setPosition(image.position);
            setPreview(`/uploads/cms/gallery/${image.filename}`);
        } else {
            setTitle('');
            setDescription('');
            setCategory('');
            setActive(true);
            setPosition(0);
            setPreview(null);
        }
        setFile(null);
    }, [image, open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const createMutation = useMutation({
        mutationFn: async (formData: FormData) => cmsService.createGalleryImage(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            toast.success('Bild hochgeladen');
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Ein Fehler ist aufgetreten');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Parameters<typeof cmsService.updateGalleryImage>[1]) =>
            cmsService.updateGalleryImage(image!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            toast.success('Bild aktualisiert');
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Ein Fehler ist aufgetreten');
        }
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (image) {
            updateMutation.mutate({ title, description, category, active, position });
        } else {
            if (!file) return;
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('active', String(active));
            formData.append('position', String(position));
            formData.append('image', file);
            createMutation.mutate(formData);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{image ? 'Bild bearbeiten' : 'Bild hochladen'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titel (optional)</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung (optional)</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Kategorie (optional)</Label>
                        <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z.B. Konzert 2024" />
                    </div>
                    {!image && (
                        <div className="space-y-2">
                            <Label htmlFor="image">Bild</Label>
                            <Input id="image" type="file" onChange={handleFileChange} accept="image/*" required />
                            {preview && (
                                <div className="mt-2 border rounded overflow-hidden aspect-video">
                                    <img src={resolveMediaUrl(preview)} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    )}
                    {image && preview && (
                        <div className="mt-2 border rounded overflow-hidden aspect-video">
                            <img src={getMediaUrl(preview)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="active">Aktiv</Label>
                        <Switch id="active" checked={active} onCheckedChange={setActive} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="position">Position (Sortierung)</Label>
                        <Input id="position" type="number" value={position} onChange={(e) => setPosition(parseInt(e.target.value) || 0)} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button type="submit" disabled={isPending || (!image && !file)}>
                            {image ? 'Speichern' : 'Hochladen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
