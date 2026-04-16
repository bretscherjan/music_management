import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search, History, Eye, User, Calendar, SlidersHorizontal, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import DiffViewer from '@/components/audit/DiffViewer';
import { PageHeader } from '@/components/common/PageHeader';

interface AuditLog {
    id: number;
    action: string;
    entity: string;
    entityId: string;
    oldValue: any;
    newValue: any;
    userId: number;
    user: {
        firstName: string;
        lastName: string;
    } | null;
    createdAt: string;
}

function actionVariant(action: string): 'destructive' | 'success' | 'secondary' {
    if (action.includes('DELETE')) return 'destructive';
    if (action.includes('CREATE')) return 'success';
    return 'secondary';
}

const AuditLogPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ entity: '', action: '' });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', page, searchTerm, filters],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(searchTerm && { search: searchTerm }),
                ...(filters.entity && { entity: filters.entity }),
                ...(filters.action && { action: filters.action }),
            });
            const res = await api.get(`/audit?${params}`);
            return res.data;
        }
    });

    const { data: metaData } = useQuery({
        queryKey: ['audit-filters'],
        queryFn: async () => {
            const res = await api.get('/audit/filters');
            return res.data;
        }
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Audit Log"
                subtitle="Alle Änderungen im System"
                Icon={History}
                actions={
                    <Button
                        variant="outline"
                        size="icon"
                        className="md:hidden h-11 w-11 rounded-2xl"
                        onClick={() => setFilterSheetOpen(true)}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                }
            />

            {/* Search + inline filters */}
            <div className="native-group p-4">
                <div className="flex gap-2">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Suche nach ID..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </form>
                    {/* Desktop filters */}
                    <div className="hidden md:flex gap-2">
                        <Select value={filters.entity || '__all__'} onValueChange={(v) => setFilters(prev => ({ ...prev, entity: v === '__all__' ? '' : v }))}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Alle Entitäten" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Alle Entitäten</SelectItem>
                                {metaData?.entities?.map((e: string) => (
                                    <SelectItem key={e} value={e}>{e}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filters.action || '__all__'} onValueChange={(v) => setFilters(prev => ({ ...prev, action: v === '__all__' ? '' : v }))}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Alle Aktionen" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Alle Aktionen</SelectItem>
                                {metaData?.actions?.map((a: string) => (
                                    <SelectItem key={a} value={a}>{a}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Filter Sheet (mobile) */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetContent side="bottom" className="pb-safe-nav">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Filter</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entität</p>
                            <Select value={filters.entity || '__all__'} onValueChange={(v) => setFilters(prev => ({ ...prev, entity: v === '__all__' ? '' : v }))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Alle Entitäten" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Alle Entitäten</SelectItem>
                                    {metaData?.entities?.map((e: string) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aktion</p>
                            <Select value={filters.action || '__all__'} onValueChange={(v) => setFilters(prev => ({ ...prev, action: v === '__all__' ? '' : v }))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Alle Aktionen" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Alle Aktionen</SelectItem>
                                    {metaData?.actions?.map((a: string) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full h-11" onClick={() => setFilterSheetOpen(false)}>Anwenden</Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Mobile card list */}
            <div className="md:hidden">
                {isLoading ? (
                    <div className="native-group divide-y divide-border/40">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-4">
                                <div className="h-10 w-10 rounded-xl bg-muted flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-4 bg-muted rounded w-32" />
                                    <div className="h-3 bg-muted rounded w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !data?.logs?.length ? (
                    <div className="native-group p-8 text-center text-sm text-muted-foreground">Keine Einträge gefunden</div>
                ) : (
                    <div className="native-group divide-y divide-border/40">
                        {data.logs.map((log: AuditLog) => (
                            <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="inset-icon bg-primary/10 flex-shrink-0">
                                    <History className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant={actionVariant(log.action)} className="text-[10px] px-1.5 py-0">
                                            {log.action}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{log.entity} #{log.entityId}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {log.user ? `${log.user.lastName} ${log.user.firstName}` : 'System'} · {format(new Date(log.createdAt), 'dd.MM.yy HH:mm', { locale: de })}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 flex-shrink-0"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block native-group overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Benutzer</TableHead>
                            <TableHead>Aktion</TableHead>
                            <TableHead>Entität</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Laden...</TableCell>
                            </TableRow>
                        ) : !data?.logs?.length ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Keine Einträge gefunden</TableCell>
                            </TableRow>
                        ) : (
                            data.logs.map((log: AuditLog) => (
                                <TableRow key={log.id} className="h-12">
                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                                            {log.user ? `${log.user.lastName} ${log.user.firstName}` : 'System'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={actionVariant(log.action)} className="text-xs">
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{log.entity}</TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-sm">{log.entityId}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1.5 text-primary hover:text-primary"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <Eye className="w-4 h-4" /> Anzeigen
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data?.pagination && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-muted-foreground">
                        Seite {page} von {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                            disabled={page >= data.pagination.totalPages}
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Diff Viewer Modal */}
            {selectedLog && (
                <DiffViewer
                    oldValue={selectedLog.oldValue}
                    newValue={selectedLog.newValue}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </div>
    );
};

export default AuditLogPage;

