import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { GalleryImage } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil, MoreVertical, Image } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { toast } from 'sonner';
import { GalleryDialog } from '@/components/admin/cms/GalleryDialog';
import { getMediaUrl } from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function GalleryManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpenCurrent] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [actionSheetImage, setActionSheetImage] = useState<GalleryImage | null>(null);

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
        setActionSheetImage(null);
        setSelectedImage(image);
        setIsDialogOpen(true);
    };

    const handleDelete = (image: GalleryImage) => {
        setActionSheetImage(null);
        setSelectedImage(image);
        setIsDeleteDialogOpenCurrent(true);
    };

    return (
        <Card className="shadow-sm rounded-2xl border-slate-100">
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
                {isLoading ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">Laden…</div>
                ) : images.length === 0 ? (
                    <EmptyState
                        icon={Image}
                        title="Keine Bilder"
                        description="Lade das erste Foto in die Galerie hoch."
                        action={{ label: 'Bild hochladen', onClick: () => { setSelectedImage(null); setIsDialogOpen(true); } }}
                    />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...images].sort((a, b) => a.position - b.position).map((image) => (
                            <div key={image.id} className="group relative border border-slate-100 rounded-2xl overflow-hidden bg-muted shadow-sm">
                                <img
                                    src={getMediaUrl(`/uploads/cms/gallery/${image.filename}`)}
                                    alt={image.title || ''}
                                    className="w-full aspect-square object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute top-2 left-2 flex gap-1">
                                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                        Pos: {image.position}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-md ${image.active ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                                        {image.active ? 'Aktiv' : 'Inaktiv'}
                                    </span>
                                </div>
                                {/* MoreVertical trigger */}
                                <button
                                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setActionSheetImage(image)}
                                >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                                    <p className="text-white text-xs font-medium truncate">{image.title || 'Unbenannt'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Action Sheet */}
            <Sheet open={!!actionSheetImage} onOpenChange={(o) => !o && setActionSheetImage(null)}>
                <SheetContent side="bottom" className="rounded-t-2xl">
                    <SheetHeader className="mb-4">
                        <SheetTitle className="text-base">{actionSheetImage?.title || 'Bild'}</SheetTitle>
                    </SheetHeader>
                    <div className="divide-y divide-border/40">
                        <button
                            className="flex items-center gap-3 w-full px-2 py-3.5 text-sm font-medium hover:bg-muted/50 rounded-xl transition-colors"
                            onClick={() => actionSheetImage && handleEdit(actionSheetImage)}
                        >
                            <div className="inset-icon bg-blue-100 text-blue-600"><Pencil className="w-4 h-4" /></div>
                            Bearbeiten
                        </button>
                        <button
                            className="flex items-center gap-3 w-full px-2 py-3.5 text-sm font-medium text-destructive hover:bg-red-50 rounded-xl transition-colors"
                            onClick={() => actionSheetImage && handleDelete(actionSheetImage)}
                        >
                            <div className="inset-icon bg-red-100 text-red-600"><Trash2 className="w-4 h-4" /></div>
                            Löschen
                        </button>
                    </div>
                </SheetContent>
            </Sheet>

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
