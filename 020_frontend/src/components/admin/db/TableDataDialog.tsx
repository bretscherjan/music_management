import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/dbService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface TableDataDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tableName: string;
}

export function TableDataDialog({ open, onOpenChange, tableName }: TableDataDialogProps) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data: columns = [] } = useQuery({
        queryKey: ['db-columns', tableName],
        queryFn: () => dbService.getTableColumns(tableName),
        enabled: open
    });

    const { data: dataResponse, isLoading } = useQuery({
        queryKey: ['db-data', tableName, page],
        queryFn: () => dbService.getTableData(tableName, { page, limit }),
        enabled: open
    });

    // Detect primary key
    const primaryKeyColumn = columns.find(c => c.Key === 'PRI')?.Field || columns[0]?.Field;

    const updateMutation = useMutation({
        mutationFn: ({ primaryKeyValue, data }: { primaryKeyValue: any, data: any }) =>
            dbService.updateRow(tableName, primaryKeyColumn, primaryKeyValue, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['db-data', tableName] });
            toast.success('Zeile aktualisiert');
        }
    });

    const handleCellChange = (columnField: string, value: any, primaryKeyValue: any) => {
        // Simple inline update for now
        updateMutation.mutate({
            primaryKeyValue,
            data: { [columnField]: value }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Daten: {tableName}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto border rounded-md">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow>
                                    {columns.map((col) => (
                                        <TableHead key={col.Field} className="font-mono text-[10px] whitespace-nowrap">
                                            {col.Field}
                                            <div className="text-[8px] text-muted-foreground font-normal">{col.Type}</div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataResponse?.data.map((row: any, i: number) => (
                                    <TableRow key={i}>
                                        {columns.map((col) => (
                                            <TableCell key={col.Field} className="p-1">
                                                <Input
                                                    defaultValue={row[col.Field]}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== String(row[col.Field])) {
                                                            handleCellChange(col.Field, e.target.value, row[primaryKeyColumn]);
                                                        }
                                                    }}
                                                    className="h-8 text-[11px] font-mono border-transparent hover:border-input focus:border-primary transition-colors"
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <div className="flex items-center justify-between py-2 mt-4 space-x-2 border-t">
                    <div className="text-sm text-muted-foreground">
                        {dataResponse?.pagination.totalCount} Zeilen gesamt
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" /> Zurück
                        </Button>
                        <span className="text-sm">Seite {page} von {dataResponse?.pagination.totalPages || 1}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= (dataResponse?.pagination.totalPages || 1)}
                        >
                            Weiter <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
