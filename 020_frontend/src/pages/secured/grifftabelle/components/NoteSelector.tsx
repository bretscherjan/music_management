import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface NoteSelectorProps {
  notes: string[];
  selected: string | null;
  onChange: (note: string) => void;
}

const WHITE_KEY_W = 32;
const WHITE_KEY_H = 96;
const BLACK_KEY_W = 20;
const BLACK_KEY_H = 58;

// Index of each white key within one octave
const WHITE_KEY_INDEX: Record<string, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

// Center alignment (in white-key units) for each black key within one octave
const BLACK_KEY_CENTER: Record<string, number> = {
  'C#': 1, 'D#': 2, 'F#': 4, 'G#': 5, 'A#': 6,
};

function parseNote(note: string): { pc: string; oct: number } {
  const m = note.match(/^([A-G]#?)(\d+)$/);
  return m ? { pc: m[1], oct: parseInt(m[2], 10) } : { pc: 'C', oct: 4 };
}

interface KeyData {
  note: string;
  x: number;
  black: boolean;
}

function buildKeyLayout(notes: string[]): { keys: KeyData[]; totalWidth: number } {
  if (notes.length === 0) return { keys: [], totalWidth: 0 };

  const parsed = notes.map(n => ({ note: n, ...parseNote(n) }));
  const baseOctave = parsed[0].oct;

  const keys: KeyData[] = parsed.map(({ note, pc, oct }) => {
    const octOffset = (oct - baseOctave) * 7 * WHITE_KEY_W;
    const black = pc in BLACK_KEY_CENTER;
    const x = black
      ? octOffset + BLACK_KEY_CENTER[pc] * WHITE_KEY_W - BLACK_KEY_W / 2
      : octOffset + WHITE_KEY_INDEX[pc] * WHITE_KEY_W;
    return { note, x, black };
  });

  // Normalize so the first white key starts at x=0
  const minX = Math.min(...keys.filter(k => !k.black).map(k => k.x));
  keys.forEach(k => (k.x -= minX));

  const lastWhite = keys.filter(k => !k.black).at(-1);
  const totalWidth = lastWhite ? lastWhite.x + WHITE_KEY_W : 0;

  return { keys, totalWidth };
}

export function NoteSelector({ notes, selected, onChange }: NoteSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [selected]);

  const { keys, totalWidth } = buildKeyLayout(notes);

  if (keys.length === 0) return null;

  const whiteKeys = keys.filter(k => !k.black);
  const blackKeys = keys.filter(k => k.black);

  return (
    <div ref={scrollRef} className="overflow-x-auto pb-2 -mx-1 px-1">
      <div
        className="relative select-none"
        style={{ width: totalWidth, height: WHITE_KEY_H + 4 }}
      >
        {/* White keys */}
        {whiteKeys.map(({ note, x }) => {
          const isSelected = note === selected;
          const { pc, oct } = parseNote(note);
          return (
            <button
              key={note}
              ref={isSelected ? (selectedRef as React.RefObject<HTMLButtonElement>) : undefined}
              onClick={() => onChange(note)}
              title={note}
              className={cn(
                'absolute top-0 border border-gray-300 rounded-b-md transition-colors',
                isSelected
                  ? 'bg-[#BDD18C] border-[#405116] z-10'
                  : 'bg-white hover:bg-[#BDD18C]/20 active:bg-[#BDD18C]/50',
              )}
              style={{ left: x, width: WHITE_KEY_W - 1, height: WHITE_KEY_H }}
            >
              <span
                className={cn(
                  'absolute bottom-1.5 left-0 right-0 text-center text-[9px] leading-none',
                  isSelected ? 'text-[#405116] font-bold' : 'text-gray-400',
                )}
              >
                {pc === 'C' ? `C${oct}` : ''}
              </span>
            </button>
          );
        })}

        {/* Black keys (rendered on top) */}
        {blackKeys.map(({ note, x }) => {
          const isSelected = note === selected;
          return (
            <button
              key={note}
              ref={isSelected ? (selectedRef as React.RefObject<HTMLButtonElement>) : undefined}
              onClick={() => onChange(note)}
              title={note}
              className={cn(
                'absolute top-0 z-20 rounded-b-sm transition-colors',
                isSelected
                  ? 'bg-[#405116] ring-2 ring-[#BDD18C]'
                  : 'bg-gray-800 hover:bg-gray-600 active:bg-gray-500',
              )}
              style={{ left: x, width: BLACK_KEY_W, height: BLACK_KEY_H }}
            />
          );
        })}
      </div>

      {/* Selected note label below keyboard */}
      <div className="mt-2 text-center text-xs text-gray-500 min-h-[1.25rem]">
        {selected && (
          <span>
            Ausgewählt: <span className="font-semibold text-[#405116]">{selected}</span>
          </span>
        )}
      </div>
    </div>
  );
}
