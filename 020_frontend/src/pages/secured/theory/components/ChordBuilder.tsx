import { useState } from 'react';
import {
  CHROMATIC_NOTES,
  CHORD_QUALITIES,
  getChordInfo,
  type ChordQuality,
} from '@/hooks/useMusicEngine';
import { cn } from '@/lib/utils';

const QUALITY_COLORS: Record<ChordQuality, { bg: string; text: string; border: string }> = {
  'major': { bg: 'hsl(var(--brand-red))', text: 'white', border: 'hsl(var(--brand-red))' },
  'minor': { bg: 'hsl(var(--brand-yellow))', text: 'hsl(var(--foreground))', border: 'hsl(var(--brand-yellow))' },
  'diminished': { bg: 'hsl(var(--muted))', text: 'hsl(var(--brand-red))', border: 'hsl(var(--brand-red) / 0.5)' },
  'augmented': { bg: 'hsl(var(--brand-red) / 0.1)', text: 'hsl(var(--brand-red))', border: 'hsl(var(--brand-red))' },
  'dominant7': { bg: 'hsl(var(--brand-red) / 0.2)', text: 'hsl(var(--brand-red))', border: 'hsl(var(--brand-red))' },
  'major7': { bg: 'hsl(var(--brand-red) / 0.3)', text: 'hsl(var(--brand-red))', border: 'hsl(var(--brand-red))' },
  'minor7': { bg: 'hsl(var(--brand-yellow) / 0.5)', text: 'hsl(var(--foreground))', border: 'hsl(var(--brand-yellow))' },
  'diminished7': { bg: 'hsl(var(--foreground))', text: 'white', border: 'hsl(var(--foreground))' },
};

// Piano key geometry for chord visualisation
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ENHARMONICS: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
  'Db': 'Db', 'Eb': 'Eb', 'Gb': 'Gb', 'Ab': 'Ab', 'Bb': 'Bb',
};

function normalizeToFlat(pc: string): string {
  return ENHARMONICS[pc] ?? pc;
}

interface MiniKeyboardProps {
  activeNotes: string[]; // German note names
  activeColor: string;
  rootNote: string;      // German
}

// A two-octave mini keyboard with highlighted chord tones
function MiniKeyboard({ activeNotes, activeColor }: MiniKeyboardProps) {
  const germanToEn: Record<string, string> = {
    'C': 'C', 'Cis': 'Db', 'Des': 'Db',
    'D': 'D', 'Dis': 'Eb', 'Es': 'Eb',
    'E': 'E', 'F': 'F', 'Fis': 'Gb', 'Ges': 'Gb',
    'G': 'G', 'Gis': 'Ab', 'As': 'Ab',
    'A': 'A', 'Ais': 'Bb', 'B': 'Bb',
    'H': 'B', 'Ces': 'Cb',
  };

  const enNotes = activeNotes.map(n => normalizeToFlat(germanToEn[n] ?? n));

  const whiteKeyW = 22, whiteKeyH = 60, blackKeyW = 14, blackKeyH = 36;
  const totalOctaves = 2;
  const totalWhite = 7 * totalOctaves;

  return (
    <svg viewBox={`0 0 ${totalWhite * whiteKeyW + 2} ${whiteKeyH + 10}`} className="w-full max-w-[320px]">
      {Array.from({ length: totalOctaves }, (_, octIdx) => (
        <g key={octIdx}>
          {WHITE_KEYS.map((letter, wi) => {
            const x = (octIdx * 7 + wi) * whiteKeyW + 1;
            const noteFlat = letter === 'B' ? 'B' : letter;
            const isActive = enNotes.includes(noteFlat);
            return (
              <rect
                key={`w-${octIdx}-${wi}`}
                x={x} y={0}
                width={whiteKeyW - 1} height={whiteKeyH}
                rx="2"
                fill={isActive ? activeColor : 'var(--color-card)'}
                stroke="var(--color-border)"
                strokeWidth="0.8"
                opacity={isActive ? 1 : 0.9}
              />
            );
          })}
          {/* Black keys */}
          {[0, 1, 3, 4, 5].map((wi) => {
            const blackNoteFlats = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
            const noteFlat = blackNoteFlats[[0, 1, 3, 4, 5].indexOf(wi)];
            const x = (octIdx * 7 + wi) * whiteKeyW + whiteKeyW - blackKeyW / 2;
            const isActive = enNotes.includes(noteFlat);
            return (
              <rect
                key={`b-${octIdx}-${wi}`}
                x={x} y={0}
                width={blackKeyW} height={blackKeyH}
                rx="2"
                fill={isActive ? activeColor : 'hsl(var(--foreground))'}
                stroke="none"
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChordBuilder() {
  const [root, setRoot] = useState('C');
  const [quality, setQuality] = useState<ChordQuality>('major');

  const chordInfo = getChordInfo(root, quality);
  const colors = QUALITY_COLORS[quality];

  return (
    <div className="flex flex-col gap-4">
      {/* Root selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Grundton</label>
        <div className="flex flex-wrap gap-1">
          {CHROMATIC_NOTES.map(n => (
            <button
              key={n.value}
              onClick={() => setRoot(n.value)}
              className={cn(
                'w-9 h-8 rounded-md text-sm font-bold border transition-all',
                root === n.value
                  ? 'shadow-sm grayscale-0'
                  : 'bg-white text-muted-foreground border-border/50 hover:border-brand-red grayscale opacity-70'
              )}
              style={root === n.value ? { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border } : {}}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Akkord-Typ</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CHORD_QUALITIES) as ChordQuality[]).map(q => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={cn(
                'px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all',
                quality === q
                  ? 'border-transparent shadow-sm'
                  : 'bg-white text-muted-foreground border-border/50 hover:border-brand-red'
              )}
              style={quality === q ? { backgroundColor: QUALITY_COLORS[q].bg, color: QUALITY_COLORS[q].text } : {}}
            >
              {CHORD_QUALITIES[q]}
            </button>
          ))}
        </div>
      </div>

      {/* Chord Display */}
      <div
        className="rounded-2xl border p-4 transition-all"
        style={{ backgroundColor: `${colors.bg}22`, borderColor: `${colors.bg}88` }}
      >
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-3xl font-bold" style={{ color: colors.text }}>
            {chordInfo.notes[0]}
          </span>
          <span className="text-sm font-semibold text-muted-foreground">
            {CHORD_QUALITIES[quality]}
          </span>
          <span className="text-xs text-muted-foreground font-mono">{chordInfo.symbol}</span>
        </div>

        {/* Chord tones breakdown */}
        <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
          {chordInfo.tones.map((tone, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-xl py-3 px-2 border transition-all"
              style={{ 
                backgroundColor: i === 0 ? colors.bg : 'white', 
                borderColor: i === 0 ? colors.border : 'hsl(var(--border))',
                boxShadow: i === 0 ? '0 4px 12px -2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <div className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">{tone.degree}</div>
              <div className="text-xl font-black" style={{ color: i === 0 ? colors.text : 'hsl(var(--foreground))' }}>
                {tone.note}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5 font-bold">{tone.interval}</div>
            </div>
          ))}
        </div>

        {/* Mini Keyboard */}
        <MiniKeyboard
          activeNotes={chordInfo.notes}
          activeColor={colors.bg}
          rootNote={chordInfo.notes[0]}
        />
      </div>

      {/* Formula */}
      <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <strong className="text-foreground">Formel:</strong>{' '}
        {chordInfo.tones.map(t => `+${t.semitones} HT`).join(' · ')}
      </div>
    </div>
  );
}
