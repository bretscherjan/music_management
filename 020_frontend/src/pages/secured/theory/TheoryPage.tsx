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

export function TheoryPage() {
  const [selectedKey, setSelectedKey] = useState<string>('C');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theorie-Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Vom geschriebenen Ton zum klingenden — interaktiv berechnet.
          </p>
        </div>
      </div>

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
      'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4',
      className
    )}>
      <div className="flex items-center gap-2 shrink-0">
        {icon && (
          <div className="p-1.5 rounded-lg bg-brand-primary/20 text-brand-primary">
            {icon}
          </div>
        )}
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
