import { useMemo } from 'react';
import grifftabellenData from '@/data/grifftabellen.json';
import type { GrifftabelleInstrument, GrifftabelleFingering } from '@/types/grifftabelle';

const instruments = grifftabellenData as GrifftabelleInstrument[];

export function useFingering(instrumentId: string, selectedNote: string | null) {
  const instrument = useMemo(
    () => instruments.find(i => i.instrumentId === instrumentId) ?? null,
    [instrumentId]
  );

  const availableNotes = useMemo((): string[] => {
    if (!instrument) return [];
    return instrument.fingerings.map(f => f.note);
  }, [instrument]);

  const fingering = useMemo((): GrifftabelleFingering | null => {
    if (!instrument || !selectedNote) return null;
    return instrument.fingerings.find(f => f.note === selectedNote) ?? null;
  }, [instrument, selectedNote]);

  return { instrument, availableNotes, fingering };
}

export function useAllInstruments(): GrifftabelleInstrument[] {
  return instruments;
}
