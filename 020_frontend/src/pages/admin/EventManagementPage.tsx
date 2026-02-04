import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Calendar, Filter, AlertTriangle } from 'lucide-react';
import { formatDate, getCategoryLabel } from '@/lib/utils';
import type { Event, EventCategory } from '@/types';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';

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

    // Filter events by category
    const filteredEvents = useMemo(() => {
        if (!events) return [];
        let filtered = [...events];
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(e => e.category === selectedCategory);
        }
        // Sort by date descending (newest first)
        return filtered.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [events, selectedCategory]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredEvents.map(e => e.id));
        } else {
            setSelectedIds([]);
        }
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

    const categoryVariant: Record<string, 'default' | 'secondary' | 'warning'> = {
        rehearsal: 'secondary',
        performance: 'default',
        other: 'warning',
    };

    const allSelected = filteredEvents.length > 0 && selectedIds.length === filteredEvents.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Terminverwaltung</h1>
                    <p className="text-muted-foreground">
                        Verwalten und löschen Sie Termine
                    </p>
                </div>

                {selectedIds.length > 0 && (
                    <Button
                        variant="destructive"
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={deleteMutation.isPending}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {selectedIds.length} löschen
                    </Button>
                )}
            </div>

            {/* Confirm Dialog */}
            {showConfirmDialog && (
                <Card className="border-destructive bg-destructive/5">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-destructive">
                                    {selectedIds.length} Termine löschen?
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen
                                    Anwesenheitsdaten werden ebenfalls gelöscht.
                                </p>
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={deleteMutation.isPending}
                                    >
                                        {deleteMutation.isPending ? 'Löschen...' : 'Endgültig löschen'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowConfirmDialog(false)}
                                    >
                                        Abbrechen
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {categories.map((cat) => (
                    <Button
                        key={cat.value}
                        variant={selectedCategory === cat.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.value)}
                        className="flex-shrink-0"
                    >
                        {cat.label}
                    </Button>
                ))}
            </div>

            {/* Events Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Termine ({filteredEvents.length})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : error ? (
                        <p className="text-center text-destructive py-4">
                            Fehler beim Laden der Termine
                        </p>
                    ) : (
                        <ZoomableTableWrapper title="Terminliste">
                            <div className="min-w-[500px]">
                                {/* Header Row */}
                                <div className="flex items-center gap-4 p-3 border-b font-medium text-sm text-muted-foreground bg-muted/5">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Alle auswählen"
                                    />
                                    <span className="w-24">Datum</span>
                                    <span className="flex-1">Titel</span>
                                    <span className="w-24 hidden sm:block">Kategorie</span>
                                </div>

                                {/* Event Rows */}
                                <div className="space-y-1 p-2">
                                    {filteredEvents.map((event) => (
                                        <EventRow
                                            key={event.id}
                                            event={event}
                                            isSelected={selectedIds.includes(event.id)}
                                            onSelect={(checked) => handleSelectOne(event.id, checked)}
                                            categoryVariant={categoryVariant}
                                        />
                                    ))}
                                </div>

                                {filteredEvents.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                        Keine Termine gefunden
                                    </p>
                                )}
                            </div>
                        </ZoomableTableWrapper>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

interface EventRowProps {
    event: Event;
    isSelected: boolean;
    onSelect: (checked: boolean) => void;
    categoryVariant: Record<string, 'default' | 'secondary' | 'warning'>;
}

function EventRow({ event, isSelected, onSelect, categoryVariant }: EventRowProps) {
    const isPast = new Date(event.date) < new Date();

    return (
        <div
            className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors ${isPast ? 'opacity-60' : ''
                } ${isSelected ? 'bg-primary/5' : ''}`}
        >
            <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                aria-label={`${event.title} auswählen`}
            />
            <span className="w-24 text-sm font-mono">
                {formatDate(event.date)}
            </span>
            <span className="flex-1 truncate font-medium">
                {event.title}
            </span>
            <Badge
                variant={categoryVariant[event.category] || 'default'}
                className="hidden sm:inline-flex"
            >
                {getCategoryLabel(event.category)}
            </Badge>
        </div>
    );
}

export default EventManagementPage;
