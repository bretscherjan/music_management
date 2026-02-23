import { useQuery } from '@tanstack/react-query';
import { dbService } from '@/services/dbService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Table as TableIcon, Key } from 'lucide-react';

export function DbDiagram() {
    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['db-tables'],
        queryFn: dbService.getTables
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 bg-muted/30 rounded-lg min-h-[600px]">
            <div className="flex flex-wrap gap-6 justify-center">
                {tables.map((table) => (
                    <TableNode key={table.name} tableName={table.name} />
                ))}
            </div>
        </div>
    );
}

function TableNode({ tableName }: { tableName: string }) {
    const { data: columns = [] } = useQuery({
        queryKey: ['db-columns', tableName],
        queryFn: () => dbService.getTableColumns(tableName)
    });

    return (
        <Card className="w-64 border-2 border-primary/20 shadow-lg hover:border-primary/50 transition-colors">
            <CardHeader className="p-3 bg-primary/5 border-b">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-primary" />
                    {tableName}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col">
                    {columns.map((col) => (
                        <div key={col.Field} className="px-3 py-1.5 flex items-center justify-between border-b last:border-0 text-[11px] font-mono">
                            <div className="flex items-center gap-1">
                                {col.Key === 'PRI' && <Key className="h-3 w-3 text-yellow-600" />}
                                <span className={col.Key === 'PRI' ? 'font-bold' : ''}>{col.Field}</span>
                            </div>
                            <span className="text-muted-foreground opacity-70">{col.Type.split('(')[0]}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
