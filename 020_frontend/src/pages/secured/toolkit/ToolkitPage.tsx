import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Timer, Wrench } from 'lucide-react';
import { Tuner } from './components/Tuner';
import { Metronome } from './components/Metronome';
import { PageHeader } from '@/components/common/PageHeader';

export function ToolkitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader
        title="Toolkit"
        subtitle="Stimmgerät und Metronom direkt im Browser"
        Icon={Wrench}
      />

      <Tabs defaultValue="tuner">
        <TabsList className="w-full mb-8 bg-muted/40 p-1 border border-border/50 h-12">
          <TabsTrigger
            value="tuner"
            className="flex-1 gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-red data-[state=active]:shadow-md data-[state=active]:border-border/50 border border-transparent transition-all font-bold"
          >
            <Mic className="h-4 w-4" />
            Stimmgerät
          </TabsTrigger>
          <TabsTrigger
            value="metronome"
            className="flex-1 gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-red data-[state=active]:shadow-md data-[state=active]:border-border/50 border border-transparent transition-all font-bold"
          >
            <Timer className="h-4 w-4" />
            Metronom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tuner" className="focus-visible:outline-none">
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 brand-glow hover-lift">
            <Tuner />
          </div>
        </TabsContent>

        <TabsContent value="metronome" className="focus-visible:outline-none">
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 brand-glow hover-lift">
            <Metronome />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
