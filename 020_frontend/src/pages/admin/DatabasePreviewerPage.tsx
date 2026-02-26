import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Table as TableIcon, Code } from 'lucide-react';
import { DbTableList } from '@/components/admin/db/DbTableList';
import { SqlConsole } from '@/components/admin/db/SqlConsole';
import { DbDiagram } from '@/components/admin/db/DbDiagram';

export function DatabasePreviewerPage() {
    const [activeTab, setActiveTab] = useState('tables');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Database className="h-8 w-8" />
                        Datenbank Previewer
                    </h1>
                    <p className="text-muted-foreground">
                        Visualisierung der Datenbankstruktur, Datenbearbeitung und SQL-Konsole.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 gap-2 h-auto bg-transparent p-0">
                    <TabsTrigger
                        value="tables"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10"
                    >
                        <TableIcon className="h-4 w-4 mr-2" />
                        Tabellen & Daten
                    </TabsTrigger>
                    <TabsTrigger
                        value="diagram"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10"
                    >
                        <Database className="h-4 w-4 mr-2" />
                        ER-Diagramm
                    </TabsTrigger>
                    <TabsTrigger
                        value="sql"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10"
                    >
                        <Code className="h-4 w-4 mr-2" />
                        SQL Konsole
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tables" className="border-none p-0 outline-none">
                    <DbTableList />
                </TabsContent>
                <TabsContent value="diagram" className="border-none p-0 outline-none">
                    <DbDiagram />
                </TabsContent>
                <TabsContent value="sql" className="border-none p-0 outline-none">
                    <SqlConsole />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default DatabasePreviewerPage;
