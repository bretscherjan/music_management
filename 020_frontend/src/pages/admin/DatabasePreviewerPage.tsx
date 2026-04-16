import { useState } from 'react';
import { Database, Table as TableIcon, Code } from 'lucide-react';
import { DbTableList } from '@/components/admin/db/DbTableList';
import { SqlConsole } from '@/components/admin/db/SqlConsole';
import { DbDiagram } from '@/components/admin/db/DbDiagram';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';

export function DatabasePreviewerPage() {
    const [activeTab, setActiveTab] = useState('tables');

    const tabs = [
        { id: 'tables', label: 'Tabellen', icon: TableIcon },
        { id: 'diagram', label: 'ER-Diagramm', icon: Database },
        { id: 'sql', label: 'SQL Konsole', icon: Code },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Datenbank Previewer"
                subtitle="Visualisierung, Datenbearbeitung und SQL-Konsole."
                Icon={Database}
            />

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
