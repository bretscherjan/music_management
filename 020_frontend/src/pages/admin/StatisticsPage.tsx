import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/statsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#22c55e', '#eab308', '#ef4444']; // Green, Yellow, Red

export function StatisticsPage() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState<string>(currentYear.toString());
    const [registerId] = useState<string>('all'); // setRegisterId unused for now

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, isLoading } = useQuery({
        queryKey: ['stats', year, registerId],
        queryFn: () => statsService.getAttendanceSummary({
            startDate,
            endDate,
            registerId: registerId === 'all' ? undefined : parseInt(registerId)
        }),
    });

    const handleExportPDF = () => {
        if (!data) return;
        const doc = new jsPDF();

        doc.text(`Anwesenheitsstatistik ${year}`, 14, 15);
        doc.text(`Generiert am: ${formatDate(new Date().toISOString())}`, 14, 22);

        const tableData = data.userStats.map(stat => [
            `${stat.user.lastName} ${stat.user.firstName}`,
            stat.user.register?.name || '-',
            `${stat.presentRate}%`,
            stat.present,
            stat.excused,
            stat.unexcused,
            stat.total
        ]);

        autoTable(doc, {
            head: [['Name', 'Register', 'Rate', 'Anwesend', 'Entschuldigt', 'Unentschuldigt', 'Total']],
            body: tableData,
            startY: 30,
        });

        doc.save(`statistik_${year}.pdf`);
    };

    const handleExportCSV = () => {
        if (!data) return;
        const csvContent = [
            ['Name', 'Register', 'Rate (%)', 'Anwesend', 'Entschuldigt', 'Unentschuldigt', 'Total'],
            ...data.userStats.map(stat => [
                `${stat.user.lastName} ${stat.user.firstName}`,
                stat.user.register?.name || '-',
                stat.presentRate,
                stat.present,
                stat.excused,
                stat.unexcused,
                stat.total
            ])
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        FileSaver.saveAs(blob, `statistik_${year}.csv`);
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!data) return <div>Keine Daten geladen</div>;

    // Prepare Top 10 Data for Bar Chart
    const top10Data = data.userStats.slice(0, 10).map(s => ({
        name: `${s.user.firstName.charAt(0)}. ${s.user.lastName}`,
        rate: s.presentRate
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statistiken</h1>
                    <p className="text-muted-foreground">Anwesenheitsauswertung für das Jahr {year}</p>
                </div>
                <div className="flex gap-2">
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Jahr" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={(currentYear).toString()}>{currentYear}</SelectItem>
                            <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
                            <SelectItem value={(currentYear - 2).toString()}>{currentYear - 2}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Register Select could be added here if we fetch registers somewhere, 
                        currently generic 'all' or hardcoded logic needed or fetch registers */}

                    <Button variant="outline" onClick={handleExportCSV} title="CSV Export">
                        <Download className="h-4 w-4 mr-2" /> CSV
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF} title="PDF Export">
                        <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Pie Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Gesamtübersicht</CardTitle>
                        <CardDescription>Verteilung aller Anwesenheiten</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }: { name?: string | number; percent?: number }) => `${name ?? ''} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {data.pieChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top 10 Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top 10 Anwesenheit</CardTitle>
                        <CardDescription>Die fleissigsten Mitglieder</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={top10Data} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} unit="%" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip formatter={(value) => [`${value}%`, 'Anwesenheit']} />
                                <Bar dataKey="rate" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Mitgliederliste</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Register</TableHead>
                                <TableHead className="text-right">Anwesenheit</TableHead>
                                <TableHead className="text-right">Statistik (P/E/U)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.userStats.map((stat) => (
                                <TableRow key={stat.user.id}>
                                    <TableCell className="font-medium">
                                        {stat.user.lastName} {stat.user.firstName}
                                    </TableCell>
                                    <TableCell>{stat.user.register?.name || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={
                                            stat.presentRate >= 80 ? 'default' :
                                                stat.presentRate >= 60 ? 'secondary' : 'destructive'
                                        }>
                                            {stat.presentRate}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {stat.present} / {stat.excused} / {stat.unexcused}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
