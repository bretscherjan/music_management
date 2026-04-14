import { useState } from 'react';
import { Database, Table as TableIcon, Code } from 'lucide-react';
import { DbTableList } from '@/components/admin/db/DbTableList';
import { SqlConsole } from '@/components/admin/db/SqlConsole';
import { DbDiagram } from '@/components/admin/db/DbDiagram';
import { cn } from '@/lib/utils';

export function DatabasePreviewerPage() {
    const [activeTab, setActiveTab] = useState('tables');

    const tabs = [
        { id: 'tables', label: 'Tabellen', icon: TableIcon },
        { id: 'diagram', label: 'ER-Diagramm', icon: Database },
        { id: 'sql', label: 'SQL Konsole', icon: Code },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        Datenbank Previewer
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Visualisierung, Datenbearbeitung und SQL-Konsole.
                    </p>
                </div>
            </div>

            {/* Segmented control */}
            <div className="segmented-control max-w-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn('segmented-control-option flex items-center gap-1.5', activeTab === tab.id && 'is-active')}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'tables' && <DbTableList />}
            {activeTab === 'diagram' && <DbDiagram />}
            {activeTab === 'sql' && <SqlConsole />}
        </div>
    );
}

export default DatabasePreviewerPage;
