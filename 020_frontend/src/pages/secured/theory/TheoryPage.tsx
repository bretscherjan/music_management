import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TranspositionCalculator } from './components/TranspositionCalculator';
import { CircleOfFifths } from './components/CircleOfFifths';
import { ScaleAnalyzer } from './components/ScaleAnalyzer';
import { ChordBuilder } from './components/ChordBuilder';
import { TheoryWiki } from './components/TheoryWiki';
import { ClefMapper } from './components/ClefMapper';
import { TimeSignatureEngine } from './components/TimeSignatureEngine';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, BookOpen, GitFork, Layers, Music2, KeySquare, Clock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';

export function TheoryPage() {
  const [selectedKey, setSelectedKey] = useState<string>('C');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Theorie"
        subtitle="Vom geschriebenen Ton zum klingenden, interaktiv berechnet"
        Icon={BookOpen}
      />

      {/* ── Mobile: Tabs ── */}
      <div className="lg:hidden">
        <Tabs defaultValue="transposition">
          <TabsList className="w-full grid grid-cols-7 text-xs">
            <TabsTrigger value="transposition"><ArrowLeftRight className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="circle"><GitFork className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="scale"><Music2 className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="chord"><Layers className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="clef"><KeySquare className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="timesig"><Clock className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="wiki"><BookOpen className="h-3.5 w-3.5" /></TabsTrigger>
          </TabsList>

          <TabsContent value="transposition">
            <BentoCard title="Transpositions-Rechner" icon={<ArrowLeftRight className="h-4 w-4" />}>
              <TranspositionCalculator />
            </BentoCard>
          </TabsContent>
          <TabsContent value="circle">
            <BentoCard title="Quintenzirkel" icon={<GitFork className="h-4 w-4" />}>
              <CircleOfFifths selectedKey={selectedKey} onSelect={e => setSelectedKey(e.major)} />
            </BentoCard>
          </TabsContent>
          <TabsContent value="scale">
            <BentoCard title="Tonleiter-Analyse" icon={<Music2 className="h-4 w-4" />}>
              <ScaleAnalyzer />
            </BentoCard>
          </TabsContent>
          <TabsContent value="chord">
            <BentoCard title="Akkord-Baukasten" icon={<Layers className="h-4 w-4" />}>
              <ChordBuilder />
            </BentoCard>
          </TabsContent>
          <TabsContent value="clef">
            <BentoCard title="Schlüssel-Mapper" icon={<KeySquare className="h-4 w-4" />}>
              <ClefMapper />
            </BentoCard>
          </TabsContent>
          <TabsContent value="timesig">
            <BentoCard title="Taktarten-Engine" icon={<Clock className="h-4 w-4" />}>
              <TimeSignatureEngine />
            </BentoCard>
          </TabsContent>
          <TabsContent value="wiki">
            <BentoCard title="Theorie-Wiki" icon={<BookOpen className="h-4 w-4" />}>
              <TheoryWiki />
            </BentoCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Desktop: Bento Grid ── */}
      <div className="hidden lg:grid grid-cols-12 gap-4">

        {/* Row 1 */}
        <div className="col-span-4">
          <BentoCard title="Quintenzirkel" icon={<GitFork className="h-4 w-4" />} className="h-full">
            <CircleOfFifths selectedKey={selectedKey} onSelect={e => setSelectedKey(e.major)} />
          </BentoCard>
        </div>
        <div className="col-span-8">
          <BentoCard title="Transpositions-Rechner" icon={<ArrowLeftRight className="h-4 w-4" />} className="h-full">
            <TranspositionCalculator />
          </BentoCard>
        </div>

        {/* Row 2 */}
        <div className="col-span-7">
          <BentoCard title="Tonleiter-Analyse" icon={<Music2 className="h-4 w-4" />} className="h-full">
            <ScaleAnalyzer />
          </BentoCard>
        </div>
        <div className="col-span-5">
          <BentoCard title="Akkord-Baukasten" icon={<Layers className="h-4 w-4" />} className="h-full">
            <ChordBuilder />
          </BentoCard>
        </div>

        {/* Row 3 */}
        <div className="col-span-6">
          <BentoCard title="Schlüssel-Mapper" icon={<KeySquare className="h-4 w-4" />} className="h-full">
            <ClefMapper />
          </BentoCard>
        </div>
        <div className="col-span-6">
          <BentoCard title="Taktarten-Engine" icon={<Clock className="h-4 w-4" />} className="h-full">
            <TimeSignatureEngine />
          </BentoCard>
        </div>

        {/* Row 4 – Full width */}
        <div className="col-span-12">
          <BentoCard title="Theorie-Wiki" icon={<BookOpen className="h-4 w-4" />}>
            <TheoryWiki />
          </BentoCard>
        </div>
      </div>
    </div>
  );
}

// ── Bento Card wrapper ────────────────────────────────────────────────────────

interface BentoCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function BentoCard({ title, icon, children, className }: BentoCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-border/50 shadow-sm p-5 flex flex-col gap-4 hover-lift group relative overflow-hidden transition-all duration-300',
      className
    )}>
      {/* Subtle colorful corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center gap-3 shrink-0 relative">
        {icon && (
          <div className="p-2.5 rounded-xl bg-accent text-brand-red shadow-sm group-hover:scale-110 group-hover:bg-brand-red group-hover:text-white transition-all duration-300">
            {icon}
          </div>
        )}
        <h2 className="font-extrabold text-foreground text-sm tracking-tight group-hover:text-brand-red transition-colors">{title}</h2>
      </div>
      <div className="flex-1 min-h-0 relative z-10">{children}</div>
    </div>
  );
}
