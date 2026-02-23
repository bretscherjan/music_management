import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { Flyer } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { FlyerDialog } from './FlyerDialog';
import { format } from 'date-fns';

export function FlyerManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);

    const { data: flyers = [], isLoading } = useQuery({
        queryKey: ['flyers'],
        queryFn: cmsService.getFlyers
    });

    const deleteMutation = useMutation({
        mutationFn: cmsService.deleteFlyer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flyers'] });
            toast.success('Flyer erfolgreich gelöscht');
            setIsDeleteDialogOpen(false);
        }
    });

    const handleDelete = (flyer: Flyer) => {
        setSelectedFlyer(flyer);
        setIsDeleteDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Werbe-Flyer</CardTitle>
                </div>
                <Button onClick={() => { setSelectedFlyer(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Flyer hinzufügen
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vorschau</TableHead>
                            <TableHead>Titel</TableHead>
                            <TableHead>Gültig von</TableHead>
                            <TableHead>Gültig bis</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flyers.map((flyer) => (
                            <TableRow key={flyer.id}>
                                <TableCell>
                                    <img
                                        src={`/uploads/cms/flyers/${flyer.filename}`}
                                        alt={flyer.title}
                                        className="h-12 w-10 object-cover rounded shadow-sm"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{flyer.title}</TableCell>
                                <TableCell>
                                    {flyer.activeFrom ? format(new Date(flyer.activeFrom), 'dd.MM.yyyy') : '-'}
                                </TableCell>
                                <TableCell>
                                    {flyer.activeTo ? format(new Date(flyer.activeTo), 'dd.MM.yyyy') : '-'}
                                </TableCell>
                                <TableCell>
                                    {flyer.active ? (
                                        <div className="flex items-center text-green-600 text-xs">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Aktiv
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-red-600 text-xs">
                                            <XCircle className="h-3 w-3 mr-1" /> Inaktiv
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(flyer)} className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {flyers.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Keine Flyer gefunden.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <FlyerDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Flyer löschen"
                description={`Möchten Sie den Flyer "${selectedFlyer?.title}" wirklich löschen?`}
                onConfirm={() => selectedFlyer && deleteMutation.mutate(selectedFlyer.id)}
                confirmText="Löschen"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </Card>
    );
}
