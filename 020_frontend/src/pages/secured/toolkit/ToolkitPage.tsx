import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Timer } from 'lucide-react';
import { Tuner } from './components/Tuner';
import { Metronome } from './components/Metronome';

export function ToolkitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Musiker-Toolkit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Stimmgerät & Metronom – direkt im Browser, keine App nötig.
        </p>
      </div>

      <Tabs defaultValue="tuner">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="tuner" className="flex-1 gap-2">
            <Mic className="h-4 w-4" />
            Stimmgerät
          </TabsTrigger>
          <TabsTrigger value="metronome" className="flex-1 gap-2">
            <Timer className="h-4 w-4" />
            Metronom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tuner">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <Tuner />
          </div>
        </TabsContent>

        <TabsContent value="metronome">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <Metronome />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
