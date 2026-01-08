import React from 'react';
import { Search, Filter } from 'lucide-react';

interface MusicSearchHeaderProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onFilterClick: () => void;
}

export const MusicSearchHeader: React.FC<MusicSearchHeaderProps> = ({
    searchTerm,
    onSearchChange,
    onFilterClick
}) => {
    return (
        <div className="bg-neutral-50 p-6 rounded-xl shadow-sm mb-8 border-l-4 border-secondary-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary-900">Notenbibliothek</h2>
                    <p className="text-neutral-600">Verwaltung des gesamten Notenbestands</p>
                </div>

                <div className="flex-1 max-w-2xl flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-secondary-500" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-neutral-200 rounded-lg leading-5 bg-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 sm:text-sm shadow-sm transition-all duration-200"
                            placeholder="Suche nach Titel, Komponist oder Arrangeur..."
                        />
                    </div>
                    <button
                        onClick={onFilterClick}
                        className="inline-flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
                    >
                        <Filter className="h-4 w-4 mr-2 text-neutral-500" />
                        Filter
                    </button>
                </div>
            </div>
        </div>
    );
};
