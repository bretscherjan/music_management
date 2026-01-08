import React from 'react';
import { useAttendanceStats } from './attendanceHelper';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export const AttendanceStats: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const { data: stats, isLoading } = useAttendanceStats(currentYear);

    if (isLoading) return <div className="p-8 text-center text-neutral-500">Lade Statistiken...</div>;

    // Filter or transform data if necessary. 
    // Assuming stats is { userName, participationRate, ... }
    const chartData = stats ? stats
        .filter(s => (s.totalEvents || 0) > 0) // Only show active members?
        .sort((a, b) => (b.participationRate || 0) - (a.participationRate || 0)) // Sort by rate
        .slice(0, 15) // Top 15 to fit on screen
        : [];

    return (
        <div className="bg-white p-6 rounded-xl shadow-card border border-neutral-200">
            <h3 className="text-lg font-medium text-primary-900 mb-6">Probenbeteiligung {currentYear} (Top 15)</h3>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} unit="%" />
                        <YAxis
                            dataKey="userName"
                            type="category"
                            width={100}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            formatter={(value: number | undefined) => [`${(value || 0).toFixed(1)}%`, 'Beteiligung']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend />
                        <Bar
                            dataKey="participationRate"
                            name="Anwesenheit"
                            fill="#801010"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 text-xs text-neutral-400 text-center">
                * Berechnet basierend auf Anwesenheit bei allen Proben und Auftritten.
            </div>
        </div>
    );
};
