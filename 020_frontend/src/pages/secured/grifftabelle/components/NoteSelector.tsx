import { useEffect, useRef, useCallback } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';

interface NoteSelectorProps {
  notes: string[];
  selected: string | null;
  onChange: (note: string) => void;
  clef?: 'treble' | 'bass';
}

const NOTE_SPACING = 42;   // px per note
const MARGIN_LEFT = 90;    // space for clef on the left
const SVG_HEIGHT = 260;    // total SVG height (room for ledger lines above + below)
const STAVE_Y = 120;       // vertical position of stave (generous margin above for high notes)

function toVexKey(note: string): string {
  const m = note.match(/^([A-G])([#b]?)(\d+)$/);
  if (!m) return 'c/4';
  return `${m[1].toLowerCase()}${m[2]}/${m[3]}`;
}

export function NoteSelector({ notes, selected, onChange, clef = 'treble' }: NoteSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Store x-center of each rendered note for click detection
  const noteXRef = useRef<{ note: string; x: number }[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || notes.length === 0) return;

    container.innerHTML = '';
    noteXRef.current = [];

    const totalWidth = MARGIN_LEFT + notes.length * NOTE_SPACING + 30;

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(totalWidth, SVG_HEIGHT);
    const ctx = renderer.getContext();

    const stave = new Stave(0, STAVE_Y, totalWidth - 5);
    stave.addClef(clef);
    stave.setContext(ctx).draw();

    const staveNoteData = notes.map(note => {
      const sn = new StaveNote({ keys: [toVexKey(note)], duration: 'q', clef });
      if (note.includes('#')) {
        sn.addModifier(new Accidental('#'));
      } else if (note.includes('b')) {
        sn.addModifier(new Accidental('b'));
      }
      // Colour: selected = brand color, others = muted foreground
      if (note === selected) {
        sn.setStyle({ fillStyle: 'var(--color-primary)', strokeStyle: 'var(--color-primary)' });
      } else {
        sn.setStyle({ fillStyle: 'var(--color-muted-foreground)', strokeStyle: 'var(--color-muted-foreground)' });
      }
      return { note, sn };
    });

    const voice = new Voice({ numBeats: notes.length, beatValue: 4 });
    voice.addTickables(staveNoteData.map(d => d.sn));
    new Formatter()
      .joinVoices([voice])
      .format([voice], totalWidth - MARGIN_LEFT - 20);
    voice.draw(ctx, stave);

    // Store rendered x-center positions for click detection
    noteXRef.current = staveNoteData.map(({ note, sn }) => ({
      note,
      x: sn.getAbsoluteX(),
    }));

    // Auto-scroll to selected note
    if (selected) {
      const pos = noteXRef.current.find(p => p.note === selected);
      if (pos && scrollRef.current) {
        const scrollEl = scrollRef.current;
        scrollEl.scrollTo({
          left: pos.x - scrollEl.clientWidth / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [notes, selected, clef]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;
      // getBoundingClientRect().left already accounts for scroll offset
      const x = e.clientX - container.getBoundingClientRect().left;
      let best: string | null = null;
      let bestDist = Infinity;
      for (const { note, x: nx } of noteXRef.current) {
        const dist = Math.abs(x - nx);
        if (dist < bestDist) { bestDist = dist; best = note; }
      }
      if (best && bestDist < NOTE_SPACING / 2) onChange(best);
    },
    [onChange],
  );

  if (notes.length === 0) return null;

  return (
    <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-border/50 bg-card">
      <div
        ref={containerRef}
        onClick={handleClick}
        className="cursor-pointer"
        title="Ton durch Klicken auf die Note auswählen"
      />
      {selected && (
        <p className="text-center text-xs text-muted-foreground pb-2">
          Ausgewählt: <span className="font-semibold text-primary">{selected}</span>
        </p>
      )}
    </div>
  );
}
