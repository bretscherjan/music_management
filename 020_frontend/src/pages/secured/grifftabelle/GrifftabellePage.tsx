import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { InstrumentSelector } from './components/InstrumentSelector';
import { NoteSelector } from './components/NoteSelector';
import { NoteStaff } from './components/NoteStaff';
import { FingeringDisplay } from './components/FingeringDisplay';
import { useFingering } from './hooks/useFingering';

const BASS_CLEF_INSTRUMENTS = new Set([
  'trombone',
  'tuba_eb',
  'tuba_bb',
  'euphonium',
  'baritone_horn',
  'bassoon',
]);

export function GrifftabellePage() {
  const [instrumentId, setInstrumentId] = useState('flute');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  const { instrument, availableNotes, fingering } = useFingering(instrumentId, selectedNote);

  const clef: 'treble' | 'bass' = BASS_CLEF_INSTRUMENTS.has(instrumentId) ? 'bass' : 'treble';

  function handleInstrumentChange(id: string) {
    setInstrumentId(id);
    setSelectedNote(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grifftabelle</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ton wählen — Griff nachschlagen.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <BookOpen className="h-3.5 w-3.5" />
          {instrument && (
            <span>
              {instrument.metadata.name} · {instrument.metadata.transposition !== 'C'
                ? `in ${instrument.metadata.transposition}`
                : 'C-Instrument'} · {instrument.metadata.range.min}–{instrument.metadata.range.max}
            </span>
          )}
        </div>
      </div>

      {/* Instrument selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Instrument
        </p>
        <InstrumentSelector value={instrumentId} onChange={handleInstrumentChange} />
      </div>

      {/* Note selector (piano keyboard) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Klaviatur — Ton wählen
        </p>
        <NoteSelector
          notes={availableNotes}
          selected={selectedNote}
          onChange={setSelectedNote}
        />
      </div>

      {/* Main content: Staff + Fingering */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Note Staff */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Note
          </p>
          <NoteStaff note={selectedNote} clef={clef} />
          {selectedNote && (
            <p className="text-center text-lg font-bold text-gray-700 mt-1">{selectedNote}</p>
          )}
        </div>

        {/* Fingering */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Griff
          </p>
          <FingeringDisplay fingering={fingering} note={selectedNote} />
        </div>
      </div>
    </div>
  );
}
