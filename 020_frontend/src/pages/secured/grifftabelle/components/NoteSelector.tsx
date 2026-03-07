import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NoteSelectorProps {
  notes: string[];
  selected: string | null;
  onChange: (note: string) => void;
}

/** Renders the accidental symbol for display (# → ♯, b → ♭). */
function formatNote(note: string): { name: string; acc: string } {
  const acc = note.includes('#') ? '♯' : note.includes('b') && note.length > 2 ? '♭' : '';
  const name = acc ? note.replace('#', '').replace(/b(?=\d)/, '') : note;
  return { name, acc };
}

export function NoteSelector({ notes, selected, onChange }: NoteSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selected]);

  if (notes.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
    >
      {notes.map(note => {
        const { name, acc } = formatNote(note);
        const isSelected = note === selected;
        const isSharp = acc === '♯' || acc === '♭';

        return (
          <button
            key={note}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => onChange(note)}
            className={cn(
              'flex-shrink-0 flex flex-col items-center justify-center',
              'w-10 h-12 rounded-lg border text-xs font-medium transition-all',
              isSharp && 'bg-gray-50',
              isSelected
                ? 'bg-[#BDD18C] border-[#405116] text-[#405116] shadow-sm scale-105'
                : 'bg-white border-gray-200 text-gray-700 hover:border-[#BDD18C] hover:bg-[#BDD18C]/10'
            )}
          >
            <span className="leading-none">{name.replace(/\d/, '')}</span>
            {acc && <span className="text-[10px] leading-none">{acc}</span>}
            <span className="text-[9px] text-gray-400 leading-none mt-0.5">
              {note.match(/\d+/)?.[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
