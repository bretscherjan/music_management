import { useState, useEffect } from 'react';
import type { RoleChangeRequestDto } from '../../api/web-api-client';
import { GovernanceHelper } from '../../helpers/GovernanceHelper';
import { CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const GovernancePage = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<RoleChangeRequestDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        GovernanceHelper.loadRequests(setRequests, setIsLoading, setError);
    }, []);

    const handleApprove = (id: number) => {
        GovernanceHelper.approveRequest(id, requests, setRequests);
    };

    return (
        <div className="animate-fade-in-up space-y-8">
            <header>
                <h1 className="text-3xl font-heading font-bold text-black flex items-center">
                    <ShieldAlert className="mr-3 text-secondary" size={32} />
                    Vorstands-Bereich
                </h1>
                <p className="text-gray-600 mt-1">Verwaltung von Rollen und Rechten.</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold font-heading text-black">Offene Rollen-Anträge</h2>
                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                        {requests.length} Offen
                    </span>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-600">{error}</div>}

                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Lade Anträge...</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 italic">Keine offenen Anträge.</div>
                        ) : (
                            requests.map((req) => (
                                <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="mb-4 md:mb-0">
                                        <div className="flex items-center space-x-3 mb-1">
                                            <span className="font-bold text-lg text-black">{req.requestedByName}</span>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-secondary font-bold">{req.newRoleName}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Clock size={16} className="mr-1" />
                                            <span>Beantragt am {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Unbekannt'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        {/* Four-Eyes Principle Check visually */}
                                        {req.requestedByUserId === user?.id ? (
                                            <div className="text-xs text-orange-500 font-bold bg-orange-50 px-3 py-1 rounded border border-orange-100">
                                                Eigener Antrag (4-Augen)
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(req.id!)}
                                                    className="flex items-center space-x-2 bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-bold transition-colors"
                                                >
                                                    <CheckCircle size={18} />
                                                    <span>Genehmigen</span>
                                                </button>
                                                <button className="flex items-center space-x-2 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-lg font-bold transition-colors">
                                                    <XCircle size={18} />
                                                    <span>Ablehnen</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                <strong>Hinweis zum 4-Augen-Prinzip:</strong> Sie können keine Anträge genehmigen, die Sie selbst gestellt haben.
                Bitte bitten Sie ein anderes Vorstandsmitglied um Genehmigung.
            </div>
        </div>
    );
};

export default GovernancePage;
