import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Timer } from 'lucide-react';
import { Tuner } from './components/Tuner';
import { Metronome } from './components/Metronome';

export function ToolkitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden bg-white rounded-2xl border border-border/50 p-6 shadow-sm brand-glow mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="relative flex items-center gap-3">
          <div className="w-1.5 h-6 bg-brand-red rounded-full shadow-[0_0_8px_rgba(230,0,4,0.3)]" />
          <div>
            <h1 className="text-xl font-extrabold text-brand-red tracking-tight">Musiker-Toolkit</h1>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 ml-0.5">
              Stimmgerät & Metronom — direkt im Browser.
            </p>
          </div>
        </div>
      </div>

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
