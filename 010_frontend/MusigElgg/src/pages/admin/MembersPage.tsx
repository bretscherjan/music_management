import { useState } from 'react';
import { useMembers, useMemberMutations } from './memberHelper';
import { Check, X, Search, User, Shield, AlertCircle } from 'lucide-react';

export function MembersPage() {
    const { pendingMembers, activeMembers, isLoading } = useMembers();
    const { approveMember, rejectMember } = useMemberMutations();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredActiveMembers = activeMembers.filter(m =>
    (m.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-primary-900">Mitgliederverwaltung</h1>
                <p className="text-neutral-500">Verwalten Sie Vereinsmitglieder und Berechtigungen.</p>
            </header>

            {/* Pending Approvals Section */}
            {pendingMembers.length > 0 && (
                <section className="bg-white rounded-xl shadow-card border border-l-4 border-l-secondary-500 overflow-hidden">
                    <div className="p-6 bg-secondary-50/50 border-b border-secondary-100 flex items-center gap-3">
                        <AlertCircle className="text-secondary-600" />
                        <div>
                            <h2 className="text-lg font-bold text-primary-900">Ausstehende Anmeldungen</h2>
                            <p className="text-sm text-secondary-700">Diese Personen warten auf Freischaltung.</p>
                        </div>
                    </div>
                    <div>
                        {pendingMembers.map((member) => (
                            <div key={member.id} className="p-6 border-b border-neutral-100 last:border-0 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 font-bold text-lg">
                                        {member.firstName?.[0]}{member.lastName?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-900">{member.firstName} {member.lastName}</h3>
                                        <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-neutral-500">
                                            <span>{member.email}</span>
                                            {member.registerName && (
                                                <span className="flex items-center gap-1">
                                                    • {member.registerName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => rejectMember.mutate(member.id!)}
                                        className="px-4 py-2 border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-100 hover:text-red-600 transition-colors flex items-center gap-2 font-medium"
                                    >
                                        <X size={18} />
                                        Ablehnen
                                    </button>
                                    <button
                                        onClick={() => approveMember.mutate(member.id!)}
                                        className="px-6 py-2 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-lg hover:from-secondary-600 hover:to-secondary-700 shadow-md transition-all flex items-center gap-2 font-bold"
                                    >
                                        <Check size={18} />
                                        Freischalten
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Active Members List */}
            <section className="bg-white rounded-xl shadow-card border border-neutral-100 flex flex-col">
                <div className="p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
                        <User className="text-primary-700" size={24} />
                        Aktive Mitglieder ({activeMembers.length})
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input
                            type="text"
                            placeholder="Suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none w-full sm:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 text-neutral-500 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Register</th>
                                <th className="px-6 py-4">Rolle</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredActiveMembers.length > 0 ? (
                                filteredActiveMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-neutral-900">{member.firstName} {member.lastName}</div>
                                                    <div className="text-xs text-neutral-500">{member.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {member.registerName || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {member.role === 'Admin' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                    <Shield size={12} />
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                                                    Mitglied
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Aktiv
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                        Keine Mitglieder gefunden.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
