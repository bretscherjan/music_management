import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search, History, Eye, User, Calendar } from 'lucide-react';
import api from '@/lib/api';
import DiffViewer from '@/components/audit/DiffViewer';

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

const AuditLogPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        entity: '',
        action: '',
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Fetch Logs
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
            const res = await api.get(`/audit?${params}`); // Use api service
            return res.data;
        }
    });

    // Fetch Filters Metadata (Available actions/entities)
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
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <History className="w-8 h-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-800">Audit Log</h1>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 flex-1">
                    <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Suche nach ID..."
                            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>

                    <div className="flex gap-2">
                        <select
                            className="border rounded-lg px-3 py-2 bg-gray-50"
                            value={filters.entity}
                            onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value, page: 1 }))} // Reset page on filter
                        >
                            <option value="">Alle Entitäten</option>
                            {metaData?.entities?.map((e: string) => (
                                <option key={e} value={e}>{e}</option>
                            ))}
                        </select>

                        <select
                            className="border rounded-lg px-3 py-2 bg-gray-50"
                            value={filters.action}
                            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value, page: 1 }))}
                        >
                            <option value="">Alle Aktionen</option>
                            {metaData?.actions?.map((a: string) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benutzer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entität</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Laden...</td>
                                </tr>
                            ) : data?.logs?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Keine Einträge gefunden</td>
                                </tr>
                            ) : (
                                data?.logs.map((log: AuditLog) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                                {log.user ? `${log.user.lastName} ${log.user.firstName}` : 'System / Gelöscht'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                                                    log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                                                        'bg-blue-100 text-blue-800'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.entity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                            {log.entityId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full"
                                            >
                                                <Eye className="w-4 h-4 mr-1" /> Anzeigen
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data?.pagination && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Seite <span className="font-medium">{page}</span> von <span className="font-medium">{data.pagination.totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Zurück
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                                        disabled={page >= data.pagination.totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Weiter
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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
