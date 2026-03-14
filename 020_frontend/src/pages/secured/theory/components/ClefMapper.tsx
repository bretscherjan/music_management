import { useEffect, useRef, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { cn } from '@/lib/utils';

// ── Clef definitions ────────────────────────────────────────────────────────

interface ClefDef {
  id: string;
  vexClef: string;
  vexClefAnnotation?: string;
  label: string;
  instrument: string;
  octaveShift: number;
  group: 'G-Schlüssel' | 'F-Schlüssel' | 'C-Schlüssel' | 'Sonderform';
  color: string;
}

const CLEFS: ClefDef[] = [
  { id: 'treble', vexClef: 'treble', label: 'Violinschlüssel', instrument: 'Flöte, Klarinette, Trompete', octaveShift: 0, group: 'G-Schlüssel', color: 'var(--color-brand-primary)' },
  { id: 'treble8vb', vexClef: 'treble', vexClefAnnotation: '8vb', label: 'Violin-8vb', instrument: 'Tenor (Gesang), Gitarre', octaveShift: -1, group: 'G-Schlüssel', color: '#6b7f2e' },
  { id: 'bass', vexClef: 'bass', label: 'Bassschlüssel', instrument: 'Tuba, Posaune, E-Bass', octaveShift: 0, group: 'F-Schlüssel', color: 'var(--color-blue-900)' },
  { id: 'baritone', vexClef: 'baritone-f', label: 'Baritonschlüssel', instrument: 'Historische Notation', octaveShift: 0, group: 'F-Schlüssel', color: '#2e5f7a' },
  { id: 'subbass', vexClef: 'subbass', label: 'Subbassschlüssel', instrument: 'Sehr tiefe Register', octaveShift: 0, group: 'F-Schlüssel', color: '#1a2f4a' },
  { id: 'alto', vexClef: 'alto', label: 'Altschlüssel', instrument: 'Bratsche, Altposaune', octaveShift: 0, group: 'C-Schlüssel', color: 'var(--color-orange-800)' },
  { id: 'tenor', vexClef: 'tenor', label: 'Tenorschlüssel', instrument: 'Cello, Fagott, Tenorposaune', octaveShift: 0, group: 'C-Schlüssel', color: '#9a5a2e' },
  { id: 'soprano', vexClef: 'soprano', label: 'Sopranschlüssel', instrument: 'Historischer Gesang', octaveShift: 0, group: 'C-Schlüssel', color: '#5a3a7a' },
  { id: 'mezzo-soprano', vexClef: 'mezzo-soprano', label: 'Mezzosopranschlüssel', instrument: 'Transpositionshilfe', octaveShift: 0, group: 'C-Schlüssel', color: '#7a4a8a' },
];

const VEX_NOTE_NAMES = ['c', 'c#', 'd', 'eb', 'e', 'f', 'f#', 'g', 'ab', 'a', 'bb', 'b'];
const NOTE_LABELS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const OCTAVES = [2, 3, 4, 5, 6];

// Canvas dimensions – tall enough for ledger lines in any octave
const SVG_W = 240;
const SVG_H = 200;
const STAVE_Y = 70;   // y of top stave line; center gives room above & below

// ── Cross-clef position reference data ──────────────────────────────────────

// Staff position names for diatonic notes C3–C5 in the 4 main clefs
// Format: 'note-octave' → position string
const CLEF_POSITIONS: Record<string, Record<string, string>> = {
  violin: {
    'C3': '4. HL unten', 'D3': 'R. zw. 4.–3. HL', 'E3': '3. HL unten', 'F3': 'R. zw. 3.–2. HL',
    'G3': '2. HL unten', 'A3': 'R. zw. 2.–1. HL', 'B3': '1. HL unten (Raum)',
    'C4': '1. HL unten', 'D4': 'Raum unter 1. Linie', 'E4': '1. Linie',
    'F4': '1. Zwischenraum', 'G4': '2. Linie', 'A4': '2. Zwischenraum',
    'B4': '3. Linie', 'C5': '3. Zwischenraum', 'D5': '4. Linie',
    'E5': '4. Zwischenraum', 'F5': '5. Linie', 'G5': 'Raum über 5. Linie',
    'A5': '1. HL oben',
  },
  bass: {
    'C2': '2. HL unten', 'D2': '1. HL unten (Raum)', 'E2': '1. HL unten',
    'F2': 'Raum unter 1. Linie', 'G2': '1. Linie', 'A2': '1. Zwischenraum',
    'B2': '2. Linie', 'C3': '2. Zwischenraum', 'D3': '3. Linie',
    'E3': '3. Zwischenraum', 'F3': '4. Linie', 'G3': '4. Zwischenraum',
    'A3': '5. Linie', 'B3': 'Raum über 5. Linie',
    'C4': '1. HL oben', 'D4': 'Raum über 1. HL oben', 'E4': '2. HL oben',
    'F4': 'Raum über 2. HL oben', 'G4': '3. HL oben',
  },
  alto: {
    'C3': 'R. unter 1. HL unten', 'D3': '1. HL unten', 'E3': 'Raum unter 1. Linie',
    'F3': '1. Linie', 'G3': '1. Zwischenraum', 'A3': '2. Linie',
    'B3': '2. Zwischenraum', 'C4': '3. Linie (Mitte)', 'D4': '3. Zwischenraum',
    'E4': '4. Linie', 'F4': '4. Zwischenraum', 'G4': '5. Linie',
    'A4': 'Raum über 5. Linie', 'B4': '1. HL oben', 'C5': 'R. über 1. HL oben',
  },
  tenor: {
    'B2': '1. HL unten', 'C3': 'Raum unter 1. Linie', 'D3': '1. Linie',
    'E3': '1. Zwischenraum', 'F3': '2. Linie', 'G3': '2. Zwischenraum',
    'A3': '3. Linie', 'B3': '3. Zwischenraum',
    'C4': '4. Linie', 'D4': '4. Zwischenraum', 'E4': '5. Linie',
    'F4': 'Raum über 5. Linie', 'G4': '1. HL oben',
    'A4': 'R. über 1. HL oben', 'B4': '2. HL oben', 'C5': 'R. über 2. HL oben',
  },
};

const CROSS_CLEF_NOTES = [
  'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',
];

// ── Single Clef Staff ────────────────────────────────────────────────────────

interface StaffProps {
  clefDef: ClefDef;
  noteIndex: number;
  octave: number;
}

function ClefStaff({ clefDef, noteIndex, octave }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const writtenOctave = octave - clefDef.octaveShift;
    const vexKey = `${VEX_NOTE_NAMES[noteIndex]}/${writtenOctave}`;

    try {
      const renderer = new Renderer(el, Renderer.Backends.SVG);
      renderer.resize(SVG_W, SVG_H);
      const context = renderer.getContext();
      context.setFont('Arial', 10);

      const stave = new Stave(10, STAVE_Y, SVG_W - 20);
      stave.addClef(clefDef.vexClef, undefined, clefDef.vexClefAnnotation);
      stave.setContext(context).draw();

      const note = new StaveNote({ clef: clefDef.vexClef, keys: [vexKey], duration: 'w' });

      const noteName = VEX_NOTE_NAMES[noteIndex];
      if (noteName.includes('#')) note.addModifier(new Accidental('#'));
      else if (noteName.includes('b')) note.addModifier(new Accidental('b'));

      note.setStyle({ fillStyle: clefDef.color, strokeStyle: clefDef.color });

      const voice = new Voice({ numBeats: 1, beatValue: 1 });
      voice.addTickables([note]);
      new Formatter().joinVoices([voice]).format([voice], SVG_W - 80);
      voice.draw(context, stave);

      // Make SVG responsive: set viewBox then allow CSS to scale width
      const svgEl = el.querySelector('svg');
      if (svgEl) {
        svgEl.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
        svgEl.style.width = '100%';
        svgEl.style.height = 'auto';
        svgEl.style.display = 'block';
      }
    } catch {
      el.innerHTML = `<div class="text-xs text-gray-400 py-6 text-center">– (Note außerhalb des Bereichs) –</div>`;
    }
  }, [clefDef, noteIndex, octave]);

  return <div ref={containerRef} className="w-full" />;
}

// ── Main Component ───────────────────────────────────────────────────────────

const GROUP_ORDER: ClefDef['group'][] = ['G-Schlüssel', 'F-Schlüssel', 'C-Schlüssel', 'Sonderform'];

export function ClefMapper() {
  const [noteIndex, setNoteIndex] = useState(0);
  const [octave, setOctave] = useState(4);
  const [activeGroups, setActiveGroups] = useState<Set<string>>(
    new Set(['G-Schlüssel', 'F-Schlüssel', 'C-Schlüssel'])
  );

  const visibleClefs = CLEFS.filter(c => activeGroups.has(c.group));
  const noteName = NOTE_LABELS[noteIndex];

  function toggleGroup(g: string) {
    setActiveGroups(prev => {
      const next = new Set(prev);
      if (next.has(g)) { if (next.size > 1) next.delete(g); }
      else next.add(g);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-gray-500">
        Wähle eine Note – sieh, wo sie in jedem Notenschlüssel auf dem Notensystem liegt.
      </p>

      {/* Note + Octave picker */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">Note</label>
          <div className="flex flex-wrap gap-1">
            {NOTE_LABELS.map((n, i) => (
              <button
                key={n}
                onClick={() => setNoteIndex(i)}
                className={cn(
                  'w-9 h-8 rounded-md text-sm font-medium border transition-all',
                  noteIndex === i
                    ? 'bg-brand-primary/50 text-brand-primary border-brand-primary/30 font-bold'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary/50'
                )}
              >{n}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">Oktave</label>
          <div className="flex gap-1">
            {OCTAVES.map(o => (
              <button
                key={o}
                onClick={() => setOctave(o)}
                className={cn(
                  'w-9 h-8 rounded-md text-sm font-medium border transition-all',
                  octave === o
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary/50'
                )}
              >{o}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Group filter */}
      <div className="flex flex-wrap gap-2">
        {GROUP_ORDER.map(g => (
          <button
            key={g}
            onClick={() => toggleGroup(g)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
              activeGroups.has(g)
                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                : 'bg-white text-gray-400 border-gray-200 hover:border-brand-primary/50'
            )}
          >{g}</button>
        ))}
      </div>

      {/* Selected note badge */}
      <div className="inline-flex items-center gap-2 bg-brand-primary text-white rounded-xl px-4 py-2 self-start">
        <span className="text-xs opacity-70">Gewählte Note:</span>
        <span className="text-xl font-bold">
          {noteName}<sub className="text-sm font-normal opacity-80">{octave}</sub>
        </span>
      </div>

      {/* Staff grid – each card auto-sizes via viewBox scaling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {visibleClefs.map(clef => (
          <div
            key={clef.id}
            className="bg-gray-50 rounded-xl border border-gray-100 p-3 flex flex-col gap-1 min-w-0"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: clef.color }} />
              <span className="text-xs font-semibold text-gray-700">{clef.label}</span>
              <span className="text-[10px] text-gray-400 ml-auto bg-gray-200 px-1.5 py-0.5 rounded-full">
                {clef.group}
              </span>
            </div>
            {/* VexFlow staff – scales to card width */}
            <div className="w-full min-w-0">
              <ClefStaff clefDef={clef} noteIndex={noteIndex} octave={octave} />
            </div>
            <div className="text-[10px] text-gray-400">{clef.instrument}</div>
          </div>
        ))}
      </div>


      {/* Static clef reference */}
      <details className="bg-gray-50 rounded-xl border border-gray-100">
        <summary className="px-4 py-3 text-xs font-semibold text-gray-600 cursor-pointer select-none">
          Alle Schlüssel – Kurzreferenz
        </summary>
        {/* ── Cross-clef comparison table ── */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Schlüssel-Vergleich</span>
            <span className="text-[10px] text-gray-400">
              Wo liegt dieselbe Note in jedem Schlüssel?
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50 even:bg-muted/30">
                  <th className="text-left px-3 py-2 font-medium text-gray-500 whitespace-nowrap">Note</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--color-brand-primary)' }}>
                    Violine (G)
                  </th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--color-blue-900)' }}>
                    Bass (F)
                  </th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--color-orange-800)' }}>
                    Alt (C/3)
                  </th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap" style={{ color: '#9a5a2e' }}>
                    Tenor (C/4)
                  </th>
                </tr>
              </thead>
              <tbody>
                {CROSS_CLEF_NOTES.map(n => {
                  const isC = n.startsWith('C');
                  const isSelected = n === `${noteName}${octave}`;
                  return (
                    <tr
                      key={n}
                      className={cn(
                        'border-b border-gray-100 transition-colors',
                        isSelected ? 'bg-brand-primary/20' : isC ? 'bg-white' : 'bg-gray-50/50',
                        'hover:bg-brand-primary/10 cursor-pointer'
                      )}
                      onClick={() => {
                        const match = n.match(/^([A-G]b?)(\d)$/);
                        if (match) {
                          const ni = NOTE_LABELS.indexOf(match[1]);
                          if (ni >= 0) { setNoteIndex(ni); setOctave(parseInt(match[2])); }
                        }
                      }}
                    >
                      <td className="px-3 py-1.5 font-bold font-mono">
                        {n}
                        {isSelected && <span className="ml-1 text-brand-primary">◀</span>}
                      </td>
                      <td className="px-3 py-1.5 text-gray-600">{CLEF_POSITIONS.violin[n] ?? '—'}</td>
                      <td className="px-3 py-1.5 text-gray-600">{CLEF_POSITIONS.bass[n] ?? '—'}</td>
                      <td className="px-3 py-1.5 text-gray-600">{CLEF_POSITIONS.alto[n] ?? '—'}</td>
                      <td className="px-3 py-1.5 text-gray-600">{CLEF_POSITIONS.tenor[n] ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-[10px] text-gray-400">
            HL = Hilfslinie · R. = Raum · Klick auf Zeile → Note auswählen
          </div>
        </div>
      </details>
    </div>
  );
}
