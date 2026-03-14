import { useState } from 'react';
import { Note } from 'tonal';
import {
  INSTRUMENTS,
  CHROMATIC_NOTES,
  toGerman,
  writtenToConcert,
  concertToWritten,
  type Instrument,
} from '@/hooks/useMusicEngine';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowLeft, Music, Pencil } from 'lucide-react';

type Mode = 'written' | 'sounding';

export function TranspositionCalculator() {
  const [mode, setMode] = useState<Mode>('written');

  // Mode: written → sounding
  const [writtenNote, setWrittenNote] = useState('C');
  const [sourceInstrument, setSourceInstrument] = useState<Instrument>('C');

  // Mode: sounding → written
  const [soundingNote, setSoundingNote] = useState('B');

  // ── Derived values ────────────────────────────────────────────────────────

  // Concert pitch depending on mode
  const concertPC = (() => {
    if (mode === 'written') {
      const cp = writtenToConcert(`${writtenNote}4`, sourceInstrument);
      return Note.get(cp).pc ?? cp;
    }
    // In "sounding" mode the user picks the concert pitch directly
    return soundingNote;
  })();

  const results = (Object.keys(INSTRUMENTS) as Instrument[]).map(inst => ({
    instrument: inst,
    ...INSTRUMENTS[inst],
    writtenNote: concertToWritten(`${concertPC}4`, inst),
  }));

  // ── Note pickers ─────────────────────────────────────────────────────────

  function NotePicker({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
  }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <div className="flex flex-wrap gap-1">
          {CHROMATIC_NOTES.map(n => (
            <button
              key={n.value}
              onClick={() => onChange(n.value)}
              className={cn(
                'w-9 h-8 rounded-md text-sm font-medium border transition-all',
                value === n.value
                  ? 'bg-green-300 text-green-800 border-green-800/30 font-bold'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              )}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-medium">
        <button
          onClick={() => setMode('written')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 transition-all',
            mode === 'written'
              ? 'bg-green-800 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
          Geschrieben → Klingend
        </button>
        <button
          onClick={() => setMode('sounding')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 transition-all border-l border-gray-200',
            mode === 'sounding'
              ? 'bg-green-800 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          )}
        >
          <Music className="h-3.5 w-3.5" />
          Klingend → Geschrieben
        </button>
      </div>

      <p className="text-xs text-gray-500 -mt-1">
        {mode === 'written'
          ? 'Wähle dein Instrument und eine geschriebene Note – sieh, was klingt und was alle anderen spielen müssen.'
          : 'Wähle den klingenden Ton – sieh, was jedes Instrument dafür schreiben (notieren) muss.'}
      </p>

      {/* ── Mode: written → sounding ── */}
      {mode === 'written' && (
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Mein Instrument</label>
            <div className="flex gap-1.5">
              {(Object.keys(INSTRUMENTS) as Instrument[]).map(inst => (
                <button
                  key={inst}
                  onClick={() => setSourceInstrument(inst)}
                  title={INSTRUMENTS[inst].description}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-sm font-semibold border transition-all',
                    sourceInstrument === inst
                      ? 'bg-green-800 text-white border-green-800'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  )}
                >
                  {INSTRUMENTS[inst].label}
                </button>
              ))}
            </div>
          </div>

          <NotePicker
            value={writtenNote}
            onChange={setWrittenNote}
            label="Geschriebene Note"
          />
        </div>
      )}

      {/* ── Mode: sounding → written ── */}
      {mode === 'sounding' && (
        <NotePicker
          value={soundingNote}
          onChange={setSoundingNote}
          label="Klingender Ton (Concert Pitch)"
        />
      )}

      {/* Concert Pitch Banner – only shown in "written" mode */}
      {mode === 'written' && (
        <div className="flex items-center gap-3 bg-green-800 text-white rounded-xl px-4 py-3">
          <Music className="h-4 w-4 shrink-0 opacity-70" />
          <div>
            <div className="text-xs opacity-70">Klingender Ton (Concert Pitch)</div>
            <div className="text-2xl font-bold tracking-tight">{toGerman(concertPC)}</div>
          </div>
        </div>
      )}

      {/* All Instrument Results */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {results.map(r => {
          const isSource = mode === 'written' && r.instrument === sourceInstrument;
          const writtenPC = Note.get(r.writtenNote).pc ?? '';
          return (
            <div
              key={r.instrument}
              className={cn(
                'flex flex-col rounded-xl border p-3 transition-all',
                isSource
                  ? 'border-green-300 bg-green-300/10'
                  : 'border-gray-100 bg-gray-50/50'
              )}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-semibold text-gray-600">{r.label}</span>
                {isSource && (
                  <span className="text-[9px] bg-green-300 text-green-800 px-1.5 py-0.5 rounded-full font-medium ml-auto">
                    ich
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 leading-none mb-0.5">schreibt</div>
              <div className="text-2xl font-bold text-gray-800 tracking-tight">
                {toGerman(writtenPC)}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{r.description}</div>
            </div>
          );
        })}
      </div>

      {/* Flow Explanation */}
      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
        {mode === 'written' ? (
          <>
            <span className="font-medium text-gray-600">
              {INSTRUMENTS[sourceInstrument].label} schreibt{' '}
              <strong className="text-gray-800">
                {CHROMATIC_NOTES.find(n => n.value === writtenNote)?.label}
              </strong>
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span>klingt als <strong className="text-green-800">{toGerman(concertPC)}</strong></span>
          </>
        ) : (
          <>
            <span className="font-medium text-gray-600">
              Klingend: <strong className="text-green-800">{toGerman(soundingNote)}</strong>
            </span>
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            <span>jedes Instrument muss entsprechend <strong>notieren</strong></span>
          </>
        )}
      </div>
    </div>
  );
}
