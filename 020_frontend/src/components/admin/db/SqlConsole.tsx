import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { dbService } from '@/services/dbService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function SqlConsole() {
    const [sql, setSql] = useState('SELECT * FROM User LIMIT 10;');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const executeMutation = useMutation({
        mutationFn: dbService.executeSql,
        onSuccess: (data) => {
            setResult(data.result);
            setError(null);
            toast.success('SQL ausgeführt');
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || err.message);
            setResult(null);
        }
    });

    const handleExecute = () => {
        if (!sql.trim()) return;
        executeMutation.mutate(sql);
    };

    const renderResult = () => {
        if (!result) return null;

        if (Array.isArray(result) && result.length > 0) {
            const keys = Object.keys(result[0]);
            return (
                <div className="overflow-auto border rounded-md max-h-[400px]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                {keys.map(key => (
                                    <TableHead key={key} className="font-mono text-xs">{key}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.slice(0, 50).map((row: any, i: number) => (
                                <TableRow key={i}>
                                    {keys.map(key => (
                                        <TableCell key={key} className="font-mono text-[11px] whitespace-nowrap">
                                            {row[key] === null ? <span className="text-muted-foreground italic">NULL</span> : String(row[key])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {result.length > 50 && (
                        <div className="p-2 text-center text-xs text-muted-foreground border-t">
                            Zeige nur die ersten 50 von {result.length} Ergebnissen.
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="p-4 border rounded-md bg-muted/50 flex items-center text-success">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Erfolgreich ausgeführt. Ergebnis: {JSON.stringify(result)}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>SQL Konsole</span>
                        <Button size="sm" onClick={handleExecute} disabled={executeMutation.isPending}>
                            <Play className="h-4 w-4 mr-2" /> Ausführen
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Textarea
                            value={sql}
                            onChange={(e) => setSql(e.target.value)}
                            className="font-mono text-sm h-40 focus-visible:ring-primary"
                            placeholder="Schreibe dein SQL-Statement hier..."
                        />
                    </div>

                    {error && (
                        <div className="p-3 border border-destructive/50 rounded-md bg-destructive/10 text-destructive text-sm flex items-start">
                            <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                            <pre className="whitespace-pre-wrap font-mono uppercase text-[10px]">{error}</pre>
                        </div>
                    )}

                    {renderResult()}
                </CardContent>
            </Card>
        </div>
    );
}
