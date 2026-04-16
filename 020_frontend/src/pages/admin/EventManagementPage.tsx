import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Trash2, Calendar, AlertTriangle, MoreVertical } from 'lucide-react';
import { cn, formatDate, getCategoryLabel } from '@/lib/utils';
import type { Event, EventCategory } from '@/types';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';
import { PageHeader } from '@/components/common/PageHeader';

const categories: { value: EventCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'rehearsal', label: 'Proben' },
    { value: 'performance', label: 'Auftritte' },
    { value: 'other', label: 'Sonstiges' },
];

export function EventManagementPage() {
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [actionDrawerEvent, setActionDrawerEvent] = useState<Event | null>(null);

    const { data: events, isLoading, error } = useQuery({
        queryKey: ['events', 'all'],
        queryFn: () => eventService.getAll(),
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: number[]) => eventService.deleteMultiple(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setSelectedIds([]);
            setShowConfirmDialog(false);
        },
    });

    const filteredEvents = useMemo(() => {
        if (!events) return [];
        let filtered = [...events];
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(e => e.category === selectedCategory);
        }
        return filtered.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [events, selectedCategory]);

    const today = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }, []);

    const upcomingEvents = useMemo(
        () => filteredEvents.filter(e => new Date(e.date) >= today),
        [filteredEvents, today]
    );

    const pastEvents = useMemo(
        () => filteredEvents.filter(e => new Date(e.date) < today),
        [filteredEvents, today]
    );

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredEvents.map(e => e.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectGroup = (ids: number[], checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...new Set([...prev, ...ids])]);
            return;
        }
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleDelete = () => {
        if (selectedIds.length > 0) {
            deleteMutation.mutate(selectedIds);
        }
    };

    const handleDeleteSingle = (event: Event) => {
        deleteMutation.mutate([event.id]);
        setActionDrawerEvent(null);
    };

    const categoryVariant: Record<string, 'default' | 'secondary' | 'warning'> = {
        rehearsal: 'secondary',
        performance: 'default',
        other: 'warning',
    };

    const allSelected = filteredEvents.length > 0 && selectedIds.length === filteredEvents.length;
    const allUpcomingSelected = upcomingEvents.length > 0 && upcomingEvents.every(e => selectedIds.includes(e.id));
    const allPastSelected = pastEvents.length > 0 && pastEvents.every(e => selectedIds.includes(e.id));

    return (
        <div className="space-y-5">
            <PageHeader
                title="Terminverwaltung"
                subtitle={`${filteredEvents.length} Termine`}
                Icon={Calendar}
                actions={selectedIds.length > 0 ? (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={deleteMutation.isPending}
                        className="gap-1.5"
                    >
                        <Trash2 className="h-4 w-4" />
                        {selectedIds.length} löschen
                    </Button>
                ) : undefined}
            />

            {/* Confirm banner */}
            {showConfirmDialog && (
                <div className="native-group p-4 border border-destructive/30 bg-destructive/5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-destructive">{selectedIds.length} Termine löschen?</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Alle zugehörigen Anwesenheitsdaten werden ebenfalls gelöscht.
                            </p>
                            <div className="flex gap-2 mt-3">
                                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
                                    {deleteMutation.isPending ? 'Löschen...' : 'Endgültig löschen'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowConfirmDialog(false)}>
                                    Abbrechen
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category segmented control */}
            <div className="segmented-control">
                {categories.map((cat) => (
                    <button
                        key={cat.value}
                        className={cn('segmented-control-option', selectedCategory === cat.value && 'is-active')}
                        onClick={() => setSelectedCategory(cat.value)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Mobile card list */}
            <div className="md:hidden">
                {isLoading ? (
                    <div className="native-group divide-y divide-border/40">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-4">
                                <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="native-group p-8 text-center text-sm text-muted-foreground">
                        Keine Termine gefunden
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="native-group px-4 py-2.5 flex items-center gap-3">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={checked => handleSelectAll(!!checked)}
                                aria-label="Alle Termine auswählen"
                            />
                            <span className="text-sm font-medium">Alle auswählen</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                                {selectedIds.length} markiert
                            </span>
                        </div>

                        {upcomingEvents.length > 0 && (
                            <>
                                <div className="native-group px-4 py-2.5 flex items-center gap-3">
                                    <Checkbox
                                        checked={allUpcomingSelected}
                                        onCheckedChange={(checked) => handleSelectGroup(upcomingEvents.map(e => e.id), !!checked)}
                                        aria-label="Alle zukünftigen Termine auswählen"
                                    />
                                    <span className="text-sm font-medium">Alle zukünftigen auswählen</span>
                                    <span className="text-xs text-muted-foreground ml-auto">{upcomingEvents.length}</span>
                                </div>
                                <div className="native-group divide-y divide-border/40">
                                    {upcomingEvents.map((event) => {
                                        const isSelected = selectedIds.includes(event.id);
                                        return (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    'flex items-center gap-3 px-4 py-3 transition-colors',
                                                    isSelected && 'bg-primary/5'
                                                )}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleSelectOne(event.id, !!checked)}
                                                    aria-label={`Termin ${event.title} auswählen`}
                                                />
                                                <div className="inset-icon bg-primary/10 flex-shrink-0 flex-col gap-0 w-11 h-11">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(event.date)} · <Badge variant={categoryVariant[event.category] || 'default'} className="text-[10px] px-1.5 py-0">{getCategoryLabel(event.category)}</Badge>
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 flex-shrink-0"
                                                    onClick={() => setActionDrawerEvent(event)}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {pastEvents.length > 0 && (
                            <>
                                <div className="native-group px-4 py-2.5 flex items-center gap-3">
                                    <Checkbox
                                        checked={allPastSelected}
                                        onCheckedChange={(checked) => handleSelectGroup(pastEvents.map(e => e.id), !!checked)}
                                        aria-label="Alle vergangenen Termine auswählen"
                                    />
                                    <span className="text-sm font-medium">Alle vergangenen auswählen</span>
                                    <span className="text-xs text-muted-foreground ml-auto">{pastEvents.length}</span>
                                </div>
                                <div className="native-group divide-y divide-border/40">
                                    {pastEvents.map((event) => {
                                        const isSelected = selectedIds.includes(event.id);
                                        return (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    'flex items-center gap-3 px-4 py-3 transition-colors opacity-60',
                                                    isSelected && 'bg-primary/5'
                                                )}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleSelectOne(event.id, !!checked)}
                                                    aria-label={`Termin ${event.title} auswählen`}
                                                />
                                                <div className="inset-icon bg-primary/10 flex-shrink-0 flex-col gap-0 w-11 h-11">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(event.date)} · <Badge variant={categoryVariant[event.category] || 'default'} className="text-[10px] px-1.5 py-0">{getCategoryLabel(event.category)}</Badge>
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 flex-shrink-0"
                                                    onClick={() => setActionDrawerEvent(event)}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile action drawer */}
            <Sheet open={!!actionDrawerEvent} onOpenChange={(open) => { if (!open) setActionDrawerEvent(null); }}>
                <SheetContent side="bottom" className="pb-safe-nav">
                    <SheetHeader className="mb-2">
                        <SheetTitle className="text-left text-base">{actionDrawerEvent?.title}</SheetTitle>
                        <p className="text-xs text-muted-foreground text-left">
                            {actionDrawerEvent && formatDate(actionDrawerEvent.date)} · {actionDrawerEvent && getCategoryLabel(actionDrawerEvent.category)}
                        </p>
                    </SheetHeader>
                    <div className="divide-y divide-border/40">
                        <Button
                            variant="ghost"
                            className="w-full h-12 justify-start gap-3 text-base font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deleteMutation.isPending}
                            onClick={() => actionDrawerEvent && handleDeleteSingle(actionDrawerEvent)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Termin löschen
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop table */}
            <div className="hidden md:block native-group overflow-hidden">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : error ? (
                    <p className="text-center text-destructive py-8 text-sm">Fehler beim Laden der Termine</p>
                ) : (
                    <ZoomableTableWrapper title="Terminliste">
                        <div className="min-w-[500px]">
                            {/* Desktop global header */}
                            <div className="flex items-center gap-4 px-4 h-10 border-b font-medium text-xs text-muted-foreground bg-muted/40">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Alle auswählen"
                                />
                                <span className="w-24">Datum</span>
                                <span className="flex-1">Titel</span>
                                <span className="w-28">Kategorie</span>
                            </div>

                            {upcomingEvents.length > 0 && (
                                <>
                                    <div className="flex items-center gap-3 px-4 h-10 border-b bg-primary/5">
                                        <Checkbox
                                            checked={allUpcomingSelected}
                                            onCheckedChange={(checked) => handleSelectGroup(upcomingEvents.map(e => e.id), !!checked)}
                                            aria-label="Alle zukünftigen auswählen"
                                        />
                                        <span className="text-xs font-semibold text-primary">Zukünftige Termine ({upcomingEvents.length})</span>
                                    </div>
                                    {upcomingEvents.map((event) => {
                                        const isSelected = selectedIds.includes(event.id);
                                        return (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    'flex items-center gap-4 px-4 h-12 hover:bg-muted/50 transition-colors border-b',
                                                    isSelected && 'bg-primary/5'
                                                )}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleSelectOne(event.id, !!checked)}
                                                />
                                                <span className="w-24 text-sm font-mono">{formatDate(event.date)}</span>
                                                <span className="flex-1 truncate font-medium text-sm">{event.title}</span>
                                                <Badge variant={categoryVariant[event.category] || 'default'} className="w-28 justify-center">
                                                    {getCategoryLabel(event.category)}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {pastEvents.length > 0 && (
                                <>
                                    <div className="flex items-center gap-3 px-4 h-10 border-b bg-muted/40">
                                        <Checkbox
                                            checked={allPastSelected}
                                            onCheckedChange={(checked) => handleSelectGroup(pastEvents.map(e => e.id), !!checked)}
                                            aria-label="Alle vergangenen auswählen"
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground">Vergangene Termine ({pastEvents.length})</span>
                                    </div>
                                    {pastEvents.map((event) => {
                                        const isSelected = selectedIds.includes(event.id);
                                        return (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    'flex items-center gap-4 px-4 h-12 hover:bg-muted/50 transition-colors border-b last:border-0 opacity-60',
                                                    isSelected && 'bg-primary/5'
                                                )}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleSelectOne(event.id, !!checked)}
                                                />
                                                <span className="w-24 text-sm font-mono">{formatDate(event.date)}</span>
                                                <span className="flex-1 truncate font-medium text-sm">{event.title}</span>
                                                <Badge variant={categoryVariant[event.category] || 'default'} className="w-28 justify-center">
                                                    {getCategoryLabel(event.category)}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {filteredEvents.length === 0 && (
                                <p className="text-center text-muted-foreground py-10 text-sm">Keine Termine gefunden</p>
                            )}
                        </div>
                    </ZoomableTableWrapper>
                )}
            </div>
        </div>
    );
}

export default EventManagementPage;

