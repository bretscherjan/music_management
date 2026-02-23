import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { GalleryImage } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { GalleryDialog } from '@/components/admin/cms/GalleryDialog';
import { format } from 'date-fns';

export function GalleryManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
            setIsDeleteDialogOpen(false);
        }
    });

    const handleDelete = (image: GalleryImage) => {
        setSelectedImage(image);
        setIsDeleteDialogOpen(true);
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
                    {images.map((image) => (
                        <div key={image.id} className="group relative border rounded-lg overflow-hidden bg-muted">
                            <img
                                src={`/uploads/cms/gallery/${image.filename}`}
                                alt={image.title || ''}
                                className="w-full aspect-square object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-white text-sm font-medium truncate">{image.title || 'Unbenannt'}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-white/70 text-xs flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {format(new Date(image.createdAt), 'dd.MM.yyyy')}
                                    </span>
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
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
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
