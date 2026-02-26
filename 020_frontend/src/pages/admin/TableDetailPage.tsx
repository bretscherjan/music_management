import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/dbService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, RefreshCw, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TableDetailPage() {
    const { tableName } = useParams<{ tableName: string }>();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');

    // Column Resizing State
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const resizingColumn = useRef<{ field: string; startX: number; startWidth: number } | null>(null);

    const { data: columns = [] } = useQuery({
        queryKey: ['db-columns', tableName],
        queryFn: () => dbService.getTableColumns(tableName!),
        enabled: !!tableName
    });

    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['db-data', tableName, page, limit],
        queryFn: () => dbService.getTableData(tableName!, { page, limit }),
        enabled: !!tableName
    });

    // Initialize default column widths
    useEffect(() => {
        if (columns.length > 0 && Object.keys(columnWidths).length === 0) {
            const initialWidths: Record<string, number> = {};
            columns.forEach(col => {
                initialWidths[col.Field] = 180; // Default width
            });
            setColumnWidths(initialWidths);
        }
    }, [columns]);

    const handleResizeStart = (field: string, e: React.MouseEvent) => {
        e.preventDefault();
        resizingColumn.current = {
            field,
            startX: e.clientX,
            startWidth: columnWidths[field] || 180
        };
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeStop);
        document.body.style.cursor = 'col-resize';
    };

    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!resizingColumn.current) return;
        const delta = e.clientX - resizingColumn.current.startX;
        const newWidth = Math.max(50, resizingColumn.current.startWidth + delta);
        setColumnWidths(prev => ({
            ...prev,
            [resizingColumn.current!.field]: newWidth
        }));
    }, []);

    const handleResizeStop = useCallback(() => {
        resizingColumn.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeStop);
        document.body.style.cursor = 'default';
    }, [handleResizeMove]);

    const handleExportCSV = () => {
        if (!response?.data || response.data.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }

        try {
            const headers = columns.map(col => col.Field).join(',');
            const rows = response.data.map((row: any) =>
                columns.map(col => {
                    const val = row[col.Field];
                    if (val === null || val === undefined) return '';
                    const str = String(val).replace(/"/g, '""');
                    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
                }).join(',')
            );

            const csvContent = [headers, ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('CSV Export erfolgreich gestartet');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Fehler beim Exportieren der Daten');
        }
    };

    const updateMutation = useMutation({
        mutationFn: ({ primaryKey, primaryKeyValue, data }: { primaryKey: string; primaryKeyValue: any; data: any }) =>
            dbService.updateRow(tableName!, primaryKey, primaryKeyValue, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['db-data', tableName] });
            toast.success('Eintrag aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren');
        }
    });

    const primaryKey = columns.find(col => col.Key === 'PRI')?.Field;

    const handleCellChange = (rowIndex: number, field: string, value: any) => {
        if (!primaryKey) {
            toast.error('Kein Primärschlüssel für diese Tabelle definiert. Bearbeiten nicht möglich.');
            return;
        }

        const row = response?.data[rowIndex];
        const primaryKeyValue = row[primaryKey];

        updateMutation.mutate({
            primaryKey,
            primaryKeyValue,
            data: { [field]: value }
        });
    };

    if (!tableName) return <div>Tabelle nicht gefunden</div>;

    return (
        <div className="container-app py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/member/admin/db">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary">{tableName}</h1>
                        <p className="text-muted-foreground">Daten verwalten und bearbeiten</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Aktualisieren
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportieren (CSV)
                    </Button>
                </div>
            </div>

            <Card className="shadow-md border-primary/10 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">Tabellendaten</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="In Ergebnissen suchen..."
                                className="pl-9 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[70vh] relative">
                        <Table className="table-fixed w-auto min-w-full">
                            <TableHeader className="sticky top-0 bg-white z-20 shadow-sm">
                                <TableRow>
                                    {columns.map((col) => (
                                        <TableHead
                                            key={col.Field}
                                            className="font-bold text-xs uppercase tracking-wider relative px-4 py-3 bg-muted/50 border-r last:border-r-0 group"
                                            style={{ width: columnWidths[col.Field] || 180 }}
                                        >
                                            <div className="flex items-center justify-between truncate pr-2">
                                                <span className="truncate">{col.Field}</span>
                                                <div
                                                    onMouseDown={(e) => handleResizeStart(col.Field, e)}
                                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 active:bg-primary transition-colors z-30 flex items-center justify-center overflow-visible"
                                                >
                                                    <div className="h-4 w-0.5 bg-muted-foreground/20 group-hover:bg-muted-foreground/40" />
                                                </div>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {response?.data.map((row: any, rowIndex: number) => (
                                    <TableRow key={rowIndex} className="hover:bg-muted/30 transition-colors">
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col.Field}
                                                className="p-0 border-r last:border-r-0"
                                                style={{ width: columnWidths[col.Field] || 180 }}
                                            >
                                                <input
                                                    className="w-full h-10 px-4 bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 border-none text-sm transition-all overflow-hidden text-ellipsis whitespace-nowrap"
                                                    defaultValue={row[col.Field]}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== String(row[col.Field])) {
                                                            handleCellChange(rowIndex, col.Field, e.target.value);
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                {(!response || response.data.length === 0) && !isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="text-center py-20 text-muted-foreground italic h-64">
                                            Keine Daten in dieser Tabelle gefunden.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {response && response.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-muted-foreground">
                        Zeige <span className="font-medium">{(page - 1) * limit + 1}</span> bis <span className="font-medium">{Math.min(page * limit, response.pagination.totalCount)}</span> von <span className="font-medium">{response.pagination.totalCount}</span> Einträgen
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Zurück
                        </Button>
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.min(5, response.pagination.totalPages) }, (_, i) => {
                                let pageNum = page;
                                if (page <= 3) pageNum = i + 1;
                                else if (page >= response.pagination.totalPages - 2) pageNum = response.pagination.totalPages - 4 + i;
                                else pageNum = page - 2 + i;

                                if (pageNum > response.pagination.totalPages) return null;

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={page === pageNum ? "default" : "ghost"}
                                        size="sm"
                                        className="w-9"
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(response.pagination.totalPages, p + 1))}
                            disabled={page === response.pagination.totalPages}
                        >
                            Weiter
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
