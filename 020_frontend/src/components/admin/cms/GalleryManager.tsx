import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { GalleryImage } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { GalleryDialog } from '@/components/admin/cms/GalleryDialog';
import { getMediaUrl } from '@/lib/api';

export function GalleryManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpenCurrent] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

    const { data: images = [], isLoading } = useQuery({
        queryKey: ['gallery'],
        queryFn: cmsService.getGalleryImages
    });

    const deleteMutation = useMutation({
        mutationFn: cmsService.deleteGalleryImage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            toast.success('Bild erfolgreich gelöscht');
            setIsDeleteDialogOpenCurrent(false);
        }
    });

    const handleEdit = (image: GalleryImage) => {
        setSelectedImage(image);
        setIsDialogOpen(true);
    };

    const handleDelete = (image: GalleryImage) => {
        setSelectedImage(image);
        setIsDeleteDialogOpenCurrent(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Foto-Galerie</CardTitle>
                </div>
                <Button onClick={() => { setSelectedImage(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Bild hochladen
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...images].sort((a, b) => a.position - b.position).map((image) => (
                        <div key={image.id} className="group relative border rounded-lg overflow-hidden bg-muted">
                            <img
                                src={getMediaUrl(`/uploads/cms/gallery/${image.filename}`)}
                                alt={image.title || ''}
                                className="w-full aspect-square object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute top-2 left-2 flex gap-1">
                                <span className="bg-black/50 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                    Pos: {image.position}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-md ${image.active ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                                    {image.active ? 'Aktiv' : 'Inaktiv'}
                                </span>
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-white text-sm font-medium truncate">{image.title || 'Unbenannt'}</p>
                                <div className="flex items-center justify-end gap-2 mt-2">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleEdit(image)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDelete(image)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {images.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-muted-foreground">
                        Keine Bilder in der Galerie.
                    </div>
                )}
            </CardContent>

            <GalleryDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                image={selectedImage}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpenCurrent}
                title="Bild löschen"
                description={`Möchten Sie dieses Bild wirklich aus der Galerie löschen?`}
                onConfirm={() => selectedImage && deleteMutation.mutate(selectedImage.id)}
                confirmText="Löschen"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </Card>
    );
}
