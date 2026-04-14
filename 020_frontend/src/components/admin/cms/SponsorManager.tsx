import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { Sponsor } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ExternalLink, GripVertical, MoreVertical, Users } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { toast } from 'sonner';
import { SponsorDialog } from '@/components/admin/cms/SponsorDialog';
import { getSponsorLogoUrl } from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function SponsorManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
    const [actionSheetSponsor, setActionSheetSponsor] = useState<Sponsor | null>(null);

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
        setActionSheetSponsor(null);
        setSelectedSponsor(sponsor);
        setIsDialogOpen(true);
    };

    const handleDelete = (sponsor: Sponsor) => {
        setActionSheetSponsor(null);
        setSelectedSponsor(sponsor);
        setIsDeleteDialogOpen(true);
    };

    return (
        <Card className="shadow-sm rounded-2xl border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Sponsoren</CardTitle>
                </div>
                <Button onClick={() => { setSelectedSponsor(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Sponsor hinzufügen
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">Laden…</div>
                ) : sponsors.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="Keine Sponsoren"
                        description="Füge den ersten Sponsor hinzu."
                        action={{ label: 'Sponsor hinzufügen', onClick: () => { setSelectedSponsor(null); setIsDialogOpen(true); } }}
                    />
                ) : (
                    <div className="divide-y divide-border/40">
                        {sponsors.map((sponsor) => (
                            <div key={sponsor.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move flex-shrink-0" />
                                <img
                                    src={getSponsorLogoUrl(sponsor.logoUrl)}
                                    alt={sponsor.name}
                                    className="h-10 w-16 object-contain bg-muted p-1 rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{sponsor.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sponsor.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {sponsor.active ? 'Aktiv' : 'Inaktiv'}
                                        </span>
                                        {sponsor.websiteUrl && (
                                            <a href={sponsor.websiteUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary flex items-center gap-0.5 hover:underline">
                                                Link <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0 text-muted-foreground"
                                    onClick={() => setActionSheetSponsor(sponsor)}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Action Sheet */}
            <Sheet open={!!actionSheetSponsor} onOpenChange={(o) => !o && setActionSheetSponsor(null)}>
                <SheetContent side="bottom" className="rounded-t-2xl">
                    <SheetHeader className="mb-4">
                        <SheetTitle className="text-base">{actionSheetSponsor?.name}</SheetTitle>
                    </SheetHeader>
                    <div className="divide-y divide-border/40">
                        <button
                            className="flex items-center gap-3 w-full px-2 py-3.5 text-sm font-medium hover:bg-muted/50 rounded-xl transition-colors"
                            onClick={() => actionSheetSponsor && handleEdit(actionSheetSponsor)}
                        >
                            <div className="inset-icon bg-blue-100 text-blue-600"><Pencil className="w-4 h-4" /></div>
                            Bearbeiten
                        </button>
                        <button
                            className="flex items-center gap-3 w-full px-2 py-3.5 text-sm font-medium text-destructive hover:bg-red-50 rounded-xl transition-colors"
                            onClick={() => actionSheetSponsor && handleDelete(actionSheetSponsor)}
                        >
                            <div className="inset-icon bg-red-100 text-red-600"><Trash2 className="w-4 h-4" /></div>
                            Löschen
                        </button>
                    </div>
                </SheetContent>
            </Sheet>

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
