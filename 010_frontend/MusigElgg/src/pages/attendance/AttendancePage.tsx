import React, { useState } from 'react';
import { QrScannerView } from './QrScannerView';
import { AttendanceTable } from './AttendanceTable';
import { AttendanceStats } from './AttendanceStats';
import { QrCode, ClipboardList, BarChart2 } from 'lucide-react';

type Tab = 'scanner' | 'list' | 'stats';

export const AttendancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('scanner');

    return (
        <div className="min-h-screen bg-neutral-50 pb-20 md:pb-8">
            {/* Header */}
            <div className="bg-primary-900 text-white p-6 shadow-md">
                <h1 className="text-2xl font-bold">Anwesenheitskontrolle</h1>
                <p className="text-primary-200 text-sm mt-1">Check-in und Übersicht</p>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

                {/* Desktop Tabs (visible on md+) */}
                <div className="hidden md:flex space-x-1 bg-neutral-200 p-1 rounded-lg w-fit mb-6">
                    <button
                        onClick={() => setActiveTab('scanner')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'scanner' ? 'bg-white text-primary-900 shadow-sm' : 'text-neutral-600 hover:text-primary-800'}`}
                    >
                        <div className="flex items-center">
                            <QrCode className="h-4 w-4 mr-2" />
                            Scanner
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-white text-primary-900 shadow-sm' : 'text-neutral-600 hover:text-primary-800'}`}
                    >
                        <div className="flex items-center">
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Listen
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'stats' ? 'bg-white text-primary-900 shadow-sm' : 'text-neutral-600 hover:text-primary-800'}`}
                    >
                        <div className="flex items-center">
                            <BarChart2 className="h-4 w-4 mr-2" />
                            Statistik
                        </div>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'scanner' && <QrScannerView />}
                    {activeTab === 'list' && <AttendanceTable />}
                    {activeTab === 'stats' && <AttendanceStats />}
                </div>
            </div>

            {/* Mobile Bottom Navigation (FAB-style or Bar) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] px-6 py-3 z-50">
                <div className="flex justify-around items-center">
                    <button
                        onClick={() => setActiveTab('scanner')}
                        className={`flex flex-col items-center space-y-1 ${activeTab === 'scanner' ? 'text-primary-700' : 'text-neutral-400'}`}
                    >
                        <QrCode className="h-6 w-6" />
                        <span className="text-xs font-medium">Scan</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex flex-col items-center space-y-1 ${activeTab === 'list' ? 'text-primary-700' : 'text-neutral-400'}`}
                    >
                        <ClipboardList className="h-6 w-6" />
                        <span className="text-xs font-medium">Liste</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex flex-col items-center space-y-1 ${activeTab === 'stats' ? 'text-primary-700' : 'text-neutral-400'}`}
                    >
                        <BarChart2 className="h-6 w-6" />
                        <span className="text-xs font-medium">Statistik</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
