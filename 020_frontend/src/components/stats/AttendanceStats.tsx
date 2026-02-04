import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useState } from 'react';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';

interface AttendanceStat {
    id: number;
    firstName: string;
    lastName: string;
    register: string;
    stats: {
        yes: number;
        no: number;
        maybe: number;
        total: number;
        rate: number;
    };
}

export function AttendanceStats() {
    // Current year date range default
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear.toString());

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: statsData, isLoading } = useQuery({
        queryKey: ['attendanceStats', year],
        queryFn: async () => {
            const response = await api.get<{ stats: AttendanceStat[] }>('/users/stats/attendance', {
                params: { fromDate: startDate, toDate: endDate }
            });
            return response.data.stats;
        },
    });

    const getRateColor = (rate: number) => {
        if (rate >= 80) return 'text-green-600';
        if (rate >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getRateIcon = (rate: number) => {
        if (rate >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (rate >= 50) return <Minus className="h-4 w-4 text-yellow-600" />;
        return <TrendingDown className="h-4 w-4 text-red-600" />;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Anwesenheitsstatistik</CardTitle>
                        <CardDescription>
                            Auswertung der Probenbesuche im Jahr {year}
                        </CardDescription>
                    </div>
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="h-10 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ZoomableTableWrapper title="Daten">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mitglied</TableHead>
                                    <TableHead>Register</TableHead>
                                    <TableHead className="text-center">Rate</TableHead>
                                    <TableHead className="text-right">Termine</TableHead>
                                    <TableHead className="text-right text-green-600">Ja</TableHead>
                                    <TableHead className="text-right text-red-600">Nein</TableHead>
                                    <TableHead className="text-right text-yellow-600">Vielleicht</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statsData?.map((stat) => (
                                    <TableRow key={stat.id}>
                                        <TableCell className="font-medium">
                                            {stat.lastName} {stat.firstName}
                                        </TableCell>
                                        <TableCell>{stat.register || '-'}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={`font-bold ${getRateColor(stat.stats.rate)}`}>
                                                    {stat.stats.rate}%
                                                </span>
                                                {getRateIcon(stat.stats.rate)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{stat.stats.total}</TableCell>
                                        <TableCell className="text-right">{stat.stats.yes}</TableCell>
                                        <TableCell className="text-right">{stat.stats.no}</TableCell>
                                        <TableCell className="text-right">{stat.stats.maybe}</TableCell>
                                    </TableRow>
                                ))}
                                {statsData?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Keine Daten vorhanden
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ZoomableTableWrapper>
                )}
            </CardContent>
        </Card>
    );
}
