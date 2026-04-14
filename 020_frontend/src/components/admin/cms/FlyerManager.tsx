import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import type { Flyer } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckCircle2, FileText, MoreVertical, Search } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { toast } from 'sonner';
import { FlyerDialog } from './FlyerDialog';
import { getMediaUrl } from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function FlyerManager() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpenCurrent] = useState(false);
    const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);
    const [actionSheetFlyer, setActionSheetFlyer] = useState<Flyer | null>(null);
    const [search, setSearch] = useState('');

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
        setActionSheetFlyer(null);
        setSelectedFlyer(flyer);
        setIsDeleteDialogOpenCurrent(true);
    };

    const filteredFlyers = [...flyers]
        .sort((a, b) => a.position - b.position)
        .filter(f => !search || f.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <Card className="shadow-sm rounded-2xl border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Aktuelles & Werbung</CardTitle>
                </div>
                <Button onClick={() => { setSelectedFlyer(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Werbung hinzufügen
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Suchen..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-xl"
                    />
                </div>

                {isLoading ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">Laden…</div>
                ) : filteredFlyers.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title={search ? 'Keine Ergebnisse' : 'Keine Werbung'}
                        description={search ? `Keine Einträge für "${search}".` : 'Füge den ersten Eintrag hinzu.'}
                        action={!search ? { label: 'Werbung hinzufügen', onClick: () => { setSelectedFlyer(null); setIsDialogOpen(true); } } : undefined}
                    />
                ) : (
                    <div className="native-group divide-y divide-border/40">
                        {filteredFlyers.map((flyer) => (
                            <div key={flyer.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                                {/* Thumbnail */}
                                {flyer.filename.toLowerCase().endsWith('.pdf') ? (
                                    <div className="h-12 w-10 bg-muted rounded-lg flex items-center justify-center border flex-shrink-0">
                                        <FileText className="h-5 w-5 text-muted-foreground opacity-50" />
                                    </div>
                                ) : (
                                    <img
                                        src={getMediaUrl(`/uploads/cms/flyers/${flyer.filename}`)}
                                        alt={flyer.title}
                                        className="h-12 w-10 object-cover rounded-lg shadow-sm flex-shrink-0"
                                    />
                                )}
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{flyer.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className="text-[10px] text-muted-foreground">
                                            {flyer.filename.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Bild'} · Pos. {flyer.position}
                                        </span>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${flyer.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {flyer.active ? 'Aktiv' : 'Inaktiv'}
                                        </span>
                                        {flyer.showOnHomePage && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5">
                                                <CheckCircle2 className="w-2.5 h-2.5" /> Home
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0 text-muted-foreground"
                                    onClick={() => setActionSheetFlyer(flyer)}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Action Sheet */}
            <Sheet open={!!actionSheetFlyer} onOpenChange={(o) => !o && setActionSheetFlyer(null)}>
                <SheetContent side="bottom" className="rounded-t-2xl">
                    <SheetHeader className="mb-4">
                        <SheetTitle className="text-base">{actionSheetFlyer?.title}</SheetTitle>
                    </SheetHeader>
                    <div className="divide-y divide-border/40">
                        <button
                            className="flex items-center gap-3 w-full px-2 py-3.5 text-sm font-medium text-destructive hover:bg-red-50 rounded-xl transition-colors"
                            onClick={() => actionSheetFlyer && handleDelete(actionSheetFlyer)}
                        >
                            <div className="inset-icon bg-red-100 text-red-600"><Trash2 className="w-4 h-4" /></div>
                            Löschen
                        </button>
                    </div>
                </SheetContent>
            </Sheet>

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


