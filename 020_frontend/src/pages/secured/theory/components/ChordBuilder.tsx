import { useState } from 'react';
import {
  CHROMATIC_NOTES,
  CHORD_QUALITIES,
  getChordInfo,
  type ChordQuality,
} from '@/hooks/useMusicEngine';
import { cn } from '@/lib/utils';

const QUALITY_COLORS: Record<ChordQuality, { bg: string; text: string; border: string }> = {
  'major':       { bg: 'var(--color-green-300)', text: 'var(--color-green-800)', border: '#405116/20' },
  'minor':       { bg: '#93c5fd', text: '#1e40af', border: '#1e40af/20' },
  'diminished':  { bg: '#fca5a5', text: '#991b1b', border: '#991b1b/20' },
  'augmented':   { bg: '#fdba74', text: '#92400e', border: '#92400e/20' },
  'dominant7':   { bg: '#c4b5fd', text: '#4c1d95', border: '#4c1d95/20' },
  'major7':      { bg: '#86efac', text: '#14532d', border: '#14532d/20' },
  'minor7':      { bg: '#a5b4fc', text: '#312e81', border: '#312e81/20' },
  'diminished7': { bg: '#f9a8d4', text: '#831843', border: '#831843/20' },
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
                fill={isActive ? activeColor : '#fff'}
                stroke="#d1d5db"
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
                fill={isActive ? 'var(--color-green-800)' : '#1f2937'}
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
        <label className="text-xs font-medium text-gray-600">Grundton</label>
        <div className="flex flex-wrap gap-1">
          {CHROMATIC_NOTES.map(n => (
            <button
              key={n.value}
              onClick={() => setRoot(n.value)}
              className={cn(
                'w-9 h-8 rounded-md text-sm font-medium border transition-all',
                root === n.value
                  ? 'border-green-800/30 font-bold'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              )}
              style={root === n.value ? { backgroundColor: colors.bg, color: colors.text } : {}}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-600">Akkord-Typ</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CHORD_QUALITIES) as ChordQuality[]).map(q => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={cn(
                'px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all',
                quality === q
                  ? 'border-transparent font-bold'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
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
          <span className="text-sm font-semibold text-gray-600">
            {CHORD_QUALITIES[quality]}
          </span>
          <span className="text-xs text-gray-400 font-mono">{chordInfo.symbol}</span>
        </div>

        {/* Chord tones breakdown */}
        <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
          {chordInfo.tones.map((tone, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-xl py-3 px-2"
              style={{ backgroundColor: i === 0 ? colors.bg : '#f9fafb', border: `1.5px solid ${i === 0 ? colors.bg : 'var(--color-gray-200)'}` }}
            >
              <div className="text-[9px] font-medium text-gray-400 mb-1">{tone.degree}</div>
              <div className="text-xl font-bold" style={{ color: i === 0 ? colors.text : '#1f2937' }}>
                {tone.note}
              </div>
              <div className="text-[9px] text-gray-400 mt-0.5 font-mono">{tone.interval}</div>
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
      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
        <strong className="text-gray-600">Formel:</strong>{' '}
        {chordInfo.tones.map(t => `+${t.semitones} HT`).join(' · ')}
      </div>
    </div>
  );
}
