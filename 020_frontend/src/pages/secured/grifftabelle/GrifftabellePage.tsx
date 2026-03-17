import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { InstrumentSelector } from './components/InstrumentSelector';
import { NoteSelector } from './components/NoteSelector';
import { NoteStaff } from './components/NoteStaff';
import { FingeringDisplay } from './components/FingeringDisplay';
import { useFingering } from './hooks/useFingering';

export function GrifftabellePage() {
  const [instrumentId, setInstrumentId] = useState('flute');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [clef, setClef] = useState<'treble' | 'bass'>('treble');

  const { instrument, availableNotes, fingering } = useFingering(instrumentId, selectedNote);

  function handleInstrumentChange(id: string) {
    setInstrumentId(id);
    setSelectedNote(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-border/50 p-6 shadow-sm brand-glow">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-yellow/5 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-brand-red rounded-full shadow-[0_0_8px_rgba(230,0,4,0.3)]" />
              <h1 className="text-xl font-extrabold text-brand-red tracking-tight">Grifftabelle</h1>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1 ml-3.5">
              Ton wählen — Griff nachschlagen.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-red bg-brand-red/5 px-3 py-1.5 rounded-full border border-brand-red/10 hidden sm:flex">
            <BookOpen className="h-3.5 w-3.5" />
            {instrument && (
              <span className="font-medium">
                {instrument.metadata.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Instrument selector */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 hover-lift group">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 group-hover:text-brand-red transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
            Instrument
          </p>
          <InstrumentSelector value={instrumentId} onChange={handleInstrumentChange} />
        </div>

        {/* Clef selector */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 hover-lift group">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 group-hover:text-brand-red transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
            Notenschlüssel
          </p>
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setClef('treble')}
              className={`flex-1 text-sm font-bold py-2 px-3 rounded-lg transition-all ${clef === 'treble'
                  ? 'bg-white shadow-md text-brand-red border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              Violinschlüssel
            </button>
            <button
              onClick={() => setClef('bass')}
              className={`flex-1 text-sm font-bold py-2 px-3 rounded-lg transition-all ${clef === 'bass'
                  ? 'bg-white shadow-md text-brand-red border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              Bassschlüssel
            </button>
          </div>
        </div>
      </div>

      {/* Note selector — long VexFlow staff */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 hover-lift group">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5 group-hover:text-brand-red transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
          Ton wählen — auf Note klicken
        </p>
        <NoteSelector
          notes={availableNotes}
          selected={selectedNote}
          onChange={setSelectedNote}
          clef={clef}
        />
      </div>

      {/* Main content: Staff + Fingering */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Note Staff */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 hover-lift group">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 group-hover:text-brand-red transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
            Note
          </p>
          <NoteStaff note={selectedNote} clef={clef} />
          {selectedNote && (
            <p className="text-center text-lg font-extrabold text-brand-red mt-1">{selectedNote}</p>
          )}
        </div>

        {/* Fingering */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 hover-lift group">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 group-hover:text-brand-red transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
            Griff
          </p>
          <FingeringDisplay fingering={fingering} note={selectedNote} />
        </div>
      </div>
    </div>
  );
}
