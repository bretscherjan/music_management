import React, { useState } from 'react';
import { useMusicLibrary, useSecureFile, type MusicFilters } from './musicHelper';
import { MusicSearchHeader } from './MusicSearchHeader';
import { CsvImportModal } from './CsvImportModal';
import { SecureAudioPlayer } from './SecureAudioPlayer';
import { FileText, Music, Archive, Plus } from 'lucide-react';

export const MusicLibraryPage: React.FC = () => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [filters] = useState<MusicFilters>({});
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Data Hook (debounced search could be added here, currently direct)
    const { data: pieces, isLoading, error } = useMusicLibrary({ ...filters, search: searchTerm });
    // const { uploadAttachment } = useMusicMutations(); // Unused for now

    // Handlers
    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    // Helper for PDF opening
    const OpenPdfButton: React.FC<{ filePath: string, title: string }> = ({ filePath }) => {
        const { objectUrl, isLoading } = useSecureFile(filePath);

        if (isLoading) return <span className="text-xs text-neutral-400">Lade...</span>;

        return (
            <a
                href={objectUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${objectUrl ? 'text-primary-700 bg-primary-50 hover:bg-primary-100' : 'text-neutral-400 cursor-not-allowed'}`}
                onClick={(e) => !objectUrl && e.preventDefault()}
            >
                <FileText className="h-4 w-4 mr-1.5" />
                PDF
            </a>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-50 p-6 md:p-8">
            {/* Header & Search */}
            <MusicSearchHeader
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onFilterClick={() => {/* TODO: Open Filter Modal */ }}
            />

            {/* Actions Bar */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Noten Importieren
                    </button>
                    {/* Add more actions here */}
                </div>
                <div className="text-sm text-neutral-500">
                    {pieces ? `${pieces.length} Stück(e) gefunden` : 'Laden...'}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    Es ist ein Fehler aufgetreten: {(error as Error).message}
                </div>
            )}

            {/* Data Grid / Table */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden border border-neutral-200">
                {isLoading ? (
                    <div className="p-12 text-center text-neutral-500">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        Lade Bibliothek...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-primary-800 text-white">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Titel</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Komponist / Arrangeur</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Genre</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Lagerort</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-64">Dateien</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                                {pieces?.map((piece) => (
                                    <tr key={piece.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-700">
                                                    <Music className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-neutral-900">{piece.title}</div>
                                                    <div className="text-xs text-neutral-500">ID: {piece.id?.substring(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-neutral-900">{piece.composer || '-'}</div>
                                            {piece.arranger && <div className="text-xs text-neutral-500">Arr: {piece.arranger}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                                {piece.genre || 'Kein Genre'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-neutral-600">
                                                <Archive className="flex-shrink-0 mr-1.5 h-4 w-4 text-secondary-500" />
                                                {piece.storageLocation ? (
                                                    <span>{piece.storageLocation}</span>
                                                ) : (
                                                    <span className="text-neutral-400 italic">Nicht zugewiesen</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                            <div className="flex flex-col gap-2">
                                                {/* PDF Action */}
                                                {piece.pdfPath && (
                                                    <OpenPdfButton filePath={piece.pdfPath} title={piece.title || 'Note'} />
                                                )}

                                                {/* Audio Action */}
                                                {piece.audioPath && (
                                                    <SecureAudioPlayer filePath={piece.audioPath} />
                                                )}

                                                {/* Missing Files placeholders or Upload triggers could go here */}
                                                {!piece.pdfPath && !piece.audioPath && (
                                                    <span className="text-xs text-neutral-400 italic">Keine Dateien</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pieces?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                            Keine Musikstücke gefunden.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CsvImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />
        </div>
    );
};
