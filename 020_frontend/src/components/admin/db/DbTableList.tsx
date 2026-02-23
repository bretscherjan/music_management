import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbService } from '@/services/dbService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TableDataDialog } from '@/components/admin/db/TableDataDialog';

export function DbTableList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [isDataDialogOpen, setIsDataDialogOpen] = useState(false);

    const { data: tables = [], isLoading, refetch } = useQuery({
        queryKey: ['db-tables'],
        queryFn: dbService.getTables
    });

    const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleViewData = (tableName: string) => {
        setSelectedTable(tableName);
        setIsDataDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-lg">Datenbank-Tabellen</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tabellen suchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => refetch()}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tabellenname</TableHead>
                                <TableHead>Zeilen</TableHead>
                                <TableHead>Grösse</TableHead>
                                <TableHead className="text-right">Aktionen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTables.map((table) => (
                                <TableRow key={table.name}>
                                    <TableCell className="font-medium font-mono text-sm">{table.name}</TableCell>
                                    <TableCell>{table.rowCount.toLocaleString()}</TableCell>
                                    <TableCell>{(table.dataSize / 1024 / 1024).toFixed(2)} MB</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewData(table.name)}>
                                            <Eye className="h-4 w-4 mr-1" /> Anzeigen
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTables.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Keine Tabellen gefunden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedTable && (
                <TableDataDialog
                    open={isDataDialogOpen}
                    onOpenChange={setIsDataDialogOpen}
                    tableName={selectedTable}
                />
            )}
        </div>
    );
}
