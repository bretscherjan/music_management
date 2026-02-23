import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { CarouselItem } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { CarouselDialog } from '@/components/admin/cms/CarouselDialog';

export function CarouselManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null);

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['carousel'],
        queryFn: cmsService.getCarouselItems
    });

    const deleteMutation = useMutation({
        mutationFn: cmsService.deleteCarouselItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carousel'] });
            toast.success('Eintrag erfolgreich gelöscht');
            setIsDeleteDialogOpen(false);
        }
    });

    const handleEdit = (item: CarouselItem) => {
        setSelectedItem(item);
        setIsDialogOpen(true);
    };

    const handleDelete = (item: CarouselItem) => {
        setSelectedItem(item);
        setIsDeleteDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Startseiten-Karussell</CardTitle>
                </div>
                <Button onClick={() => { setSelectedItem(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Bild hinzufügen
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Bild</TableHead>
                            <TableHead>Titel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-move" /></TableCell>
                                <TableCell>
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title || ''}
                                        className="h-10 w-20 object-cover rounded"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{item.title || 'Kein Titel'}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${item.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.active ? 'Aktiv' : 'Inaktiv'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {items.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Keine Bilder gefunden.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <CarouselDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                item={selectedItem}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Eintrag löschen"
                description={`Möchten Sie diesen Karussell-Eintrag wirklich löschen?`}
                onConfirm={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
                confirmText="Löschen"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </Card>
    );
}
