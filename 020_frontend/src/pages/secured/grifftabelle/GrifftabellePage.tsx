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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Instrument selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Instrument
          </p>
          <InstrumentSelector value={instrumentId} onChange={handleInstrumentChange} />
        </div>

        {/* Clef selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Notenschlüssel
          </p>
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button
              onClick={() => setClef('treble')}
              className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all ${clef === 'treble'
                  ? 'bg-white shadow-sm text-green-800 border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Violinschlüssel
            </button>
            <button
              onClick={() => setClef('bass')}
              className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all ${clef === 'bass'
                  ? 'bg-white shadow-sm text-green-800 border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Bassschlüssel
            </button>
          </div>
        </div>
      </div>

      {/* Note selector — long VexFlow staff */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
