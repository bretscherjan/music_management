import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { Flyer } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { FlyerDialog } from './FlyerDialog';
import { getMediaUrl } from '@/lib/api';

export function FlyerManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpenCurrent] = useState(false);
    const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);

    const { data: flyers = [], isLoading } = useQuery({
        queryKey: ['flyers'],
        queryFn: cmsService.getFlyers
    });

    const deleteMutation = useMutation({
        mutationFn: cmsService.deleteFlyer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flyers'] });
            toast.success('Eintrag erfolgreich gelöscht');
            setIsDeleteDialogOpenCurrent(false);
        }
    });

    const handleDelete = (flyer: Flyer) => {
        setSelectedFlyer(flyer);
        setIsDeleteDialogOpenCurrent(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Aktuelles & Werbung</CardTitle>
                </div>
                <Button onClick={() => { setSelectedFlyer(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Werbung hinzufügen
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vorschau</TableHead>
                            <TableHead>Titel</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead>Pos.</TableHead>
                            <TableHead>Home</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...flyers].sort((a, b) => a.position - b.position).map((flyer) => (
                            <TableRow key={flyer.id}>
                                <TableCell>
                                    {flyer.filename.toLowerCase().endsWith('.pdf') ? (
                                        <div className="h-12 w-10 bg-muted rounded flex items-center justify-center border">
                                            <FileText className="h-6 w-6 text-muted-foreground opacity-50" />
                                        </div>
                                    ) : (
                                        <img
                                            src={getMediaUrl(`/uploads/cms/flyers/${flyer.filename}`)}
                                            alt={flyer.title}
                                            className="h-12 w-10 object-cover rounded shadow-sm"
                                        />
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{flyer.title}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {flyer.filename.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Bild'}
                                </TableCell>
                                <TableCell className="text-xs font-mono">{flyer.position}</TableCell>
                                <TableCell>
                                    {flyer.showOnHomePage ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-muted-foreground opacity-30" />
                                    )}
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
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Keine Werbung gefunden.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <FlyerDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                flyer={selectedFlyer}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpenCurrent}
                title="Eintrag löschen"
                description={`Möchten Sie die Werbung "${selectedFlyer?.title}" wirklich löschen?`}
                onConfirm={() => selectedFlyer && deleteMutation.mutate(selectedFlyer.id)}
                confirmText="Löschen"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </Card>
    );
}
