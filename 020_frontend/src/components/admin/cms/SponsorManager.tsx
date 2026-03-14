import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { Sponsor } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, ExternalLink, GripVertical } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { SponsorDialog } from '@/components/admin/cms/SponsorDialog';
import { getMediaUrl } from '@/lib/api';

export function SponsorManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

    const { data: sponsors = [], isLoading } = useQuery({
        queryKey: ['sponsors'],
        queryFn: cmsService.getSponsors
    });

    const deleteMutation = useMutation({
        mutationFn: cmsService.deleteSponsor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sponsors'] });
            toast.success('Sponsor erfolgreich gelöscht');
            setIsDeleteDialogOpen(false);
        }
    });

    const handleEdit = (sponsor: Sponsor) => {
        setSelectedSponsor(sponsor);
        setIsDialogOpen(true);
    };

    const handleDelete = (sponsor: Sponsor) => {
        setSelectedSponsor(sponsor);
        setIsDeleteDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Sponsoren</CardTitle>
                </div>
                <Button onClick={() => { setSelectedSponsor(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Sponsor hinzufügen
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Logo</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sponsors.map((sponsor) => (
                            <TableRow key={sponsor.id}>
                                <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-move" /></TableCell>
                                <TableCell>
                                    <img
                                        src={getMediaUrl(sponsor.logoUrl)}
                                        alt={sponsor.name}
                                        className="h-10 w-20 object-contain bg-muted p-1 rounded"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{sponsor.name}</TableCell>
                                <TableCell>
                                    {sponsor.websiteUrl ? (
                                        <a href={sponsor.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center text-primary hover:underline">
                                            Link <ExternalLink className="ml-1 h-3 w-3" />
                                        </a>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${sponsor.active ? 'bg-success/10 text-success' : 'bg-red-100 text-red-700'}`}>
                                        {sponsor.active ? 'Aktiv' : 'Inaktiv'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(sponsor)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(sponsor)} className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sponsors.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Keine Sponsoren gefunden.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <SponsorDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                sponsor={selectedSponsor}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Sponsor löschen"
                description={`Möchten Sie den Sponsor "${selectedSponsor?.name}" wirklich löschen?`}
                onConfirm={() => selectedSponsor && deleteMutation.mutate(selectedSponsor.id)}
                confirmText="Löschen"
                variant="destructive"
            />
        </Card>
    );
}
