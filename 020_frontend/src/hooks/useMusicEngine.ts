/**
 * useMusicEngine – abstracts Tonal.js calculations for the Theorie-Engine.
 * Returns pure computation functions (no internal state).
 */
import { Note, Scale, Chord, Key, Interval } from 'tonal';

// ── German ↔ English Note Names ─────────────────────────────────────────────

const EN_TO_DE: Record<string, string> = {
  C: 'C', 'C#': 'Cis', Db: 'Des',
  D: 'D', 'D#': 'Dis', Eb: 'Es',
  E: 'E',
  F: 'F', 'F#': 'Fis', Gb: 'Ges',
  G: 'G', 'G#': 'Gis', Ab: 'As',
  A: 'A', 'A#': 'Ais', Bb: 'B',
  B: 'H', Cb: 'Ces',
};

// Tonal uses enharmonic spellings – normalise for display
export function toGerman(enNote: string): string {
  const n = Note.get(enNote);
  const pc = n.pc ?? enNote;
  return EN_TO_DE[pc] ?? enNote;
}

export function toGermanWithOctave(enNote: string): string {
  const n = Note.get(enNote);
  const pc = n.pc ?? enNote;
  const oct = n.oct;
  const de = EN_TO_DE[pc] ?? enNote;
  return oct !== undefined ? `${de}${oct}` : de;
}

// ── Instrument Transpositions ────────────────────────────────────────────────

export type Instrument = 'C' | 'Bb' | 'Eb' | 'F';

export const INSTRUMENTS: Record<Instrument, { label: string; semitones: number; description: string }> = {
  C: { label: 'C', semitones: 0, description: 'Konzert / Klavier / Flöte' },
  Bb: { label: 'B', semitones: 2, description: 'Klarinette / Trompete / Tenorsax' },
  Eb: { label: 'Es', semitones: 9, description: 'Altsaxophon / Eb-Klarinette' },
  F: { label: 'F', semitones: 7, description: 'Horn / Englischhorn' },
};

/** Written note → concert pitch (subtract semitone offset of instrument) */
export function writtenToConcert(written: string, instrument: Instrument): string {
  const semis = INSTRUMENTS[instrument].semitones;
  if (semis === 0) return written;
  return Note.transpose(written, Interval.fromSemitones(-semis)) ?? written;
}

/** Concert pitch → written note for a given instrument (add offset) */
export function concertToWritten(concert: string, instrument: Instrument): string {
  const semis = INSTRUMENTS[instrument].semitones;
  if (semis === 0) return concert;
  return Note.transpose(concert, Interval.fromSemitones(semis)) ?? concert;
}

// ── Scale Engine ─────────────────────────────────────────────────────────────

export type ScaleMode = 'major' | 'minor' | 'harmonic minor' | 'dorian' | 'mixolydian';

export const SCALE_MODES: Record<ScaleMode, string> = {
  'major': 'Dur ',
  'minor': 'Natürliches-Moll',
  'harmonic minor': 'Harmonisches-Moll',
  'dorian': 'Dorisch',
  'mixolydian': 'Mixolydisch',
};

export interface ScaleInfo {
  root: string;
  mode: ScaleMode;
  notes: string[];         // with octaves, e.g. ['C4','D4','E4',...]
  noteNames: string[];     // German pitch-class names, e.g. ['C','D','E',...]
  halfStepAfter: number[]; // indices where there's a half-step to the NEXT note (0-based)
  semitonesAfter: number[];// semitone distance to the NEXT note (e.g. 1, 2, 3)
  keySignature: string;    // e.g. '##' or 'bb'
  relativeKey?: string;    // e.g. 'Am' for C major
}

export function getScaleInfo(root: string, mode: ScaleMode): ScaleInfo {
  const scaleId = `${root} ${mode}`;
  const scaleData = Scale.get(scaleId);
  const pcs = scaleData.notes; // pitch classes without octave

  // Start alle Tonleitern auf Oktave 4, damit keine unerwarteten Sprünge entstehen
  const startOctave = 4;
  const noteWithOctaves: string[] = [];
  let currentOctave = startOctave;
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  for (let i = 0; i < pcs.length; i++) {
    const letter = pcs[i][0];
    if (i > 0) {
      const prevLetter = pcs[i - 1][0];
      if (LETTERS.indexOf(letter) <= LETTERS.indexOf(prevLetter)) currentOctave++;
    }
    noteWithOctaves.push(`${pcs[i]}${currentOctave}`);
  }
  // Add octave note at top
  noteWithOctaves.push(`${root}${startOctave + 1}`);

  // Find half-step positions using intervals
  const intervals = scaleData.intervals;
  const halfStepAfter: number[] = [];
  const semitonesAfter: number[] = [];
  for (let i = 0; i < intervals.length; i++) {
    const curr = Interval.semitones(intervals[i]) ?? 0;
    const next = i + 1 < intervals.length
      ? (Interval.semitones(intervals[i + 1]) ?? 0)
      : 12;
    const diff = next - curr;
    semitonesAfter.push(diff);
    if (diff === 1) halfStepAfter.push(i);
  }

  // Key signature
  let keySig = '';
  let relativeKey: string | undefined;
  try {
    if (mode === 'major') {
      const k = Key.majorKey(root);
      keySig = k.keySignature;
      relativeKey = k.minorRelative ? `${k.minorRelative}m` : undefined;
    } else if (mode === 'minor') {
      const k = Key.minorKey(root);
      keySig = k.keySignature;
      relativeKey = k.relativeMajor ?? undefined;
    }
  } catch { /* ignore */ }

  return {
    root,
    mode,
    notes: noteWithOctaves,
    noteNames: [
      ...pcs.map(toGerman),
      toGerman(root), // octave note
    ],
    halfStepAfter,
    semitonesAfter,
    keySignature: keySig,
    relativeKey,
  };
}

// ── Chord Engine ─────────────────────────────────────────────────────────────

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant7' | 'major7' | 'minor7' | 'diminished7';

export const CHORD_QUALITIES: Record<ChordQuality, string> = {
  'major': 'Dur',
  'minor': 'Moll',
  'diminished': 'Vermindert',
  'augmented': 'Übermässig',
  'dominant7': 'Dominant-Sept (7)',
  'major7': 'Dur-Sept (M7)',
  'minor7': 'Moll-Sept (m7)',
  'diminished7': 'Verm. Sept (°7)',
};

const CHORD_TONAL_MAP: Record<ChordQuality, string> = {
  'major': 'M',
  'minor': 'm',
  'diminished': 'dim',
  'augmented': 'aug',
  'dominant7': '7',
  'major7': 'M7',
  'minor7': 'm7',
  'diminished7': 'dim7',
};

export interface ChordTone {
  degree: string;   // e.g. 'Grundton', 'Terz', 'Quinte', 'Septime'
  interval: string; // e.g. '1P', '3M', '5P'
  note: string;     // German note name
  semitones: number;
}

export interface ChordInfo {
  root: string;
  quality: ChordQuality;
  symbol: string;
  notes: string[];     // German note names
  tones: ChordTone[];
}

export function getChordInfo(root: string, quality: ChordQuality): ChordInfo {
  const tonalName = `${root}${CHORD_TONAL_MAP[quality]}`;
  const chord = Chord.get(tonalName);
  const tones: ChordTone[] = chord.intervals.map((interval) => {
    const note = Note.transpose(`${root}4`, interval) ?? '';
    const semis = Interval.semitones(interval) ?? 0;
    const degreeLabel = (() => {
      const s = semis;
      if (s === 0) return 'Grundton';
      if (s === 3) return 'Kleine Terz';
      if (s === 4) return 'Grosse Terz';
      if (s === 6) return 'Tritonus';
      if (s === 7) return 'Quinte';
      if (s === 8) return 'Überm. Quinte';
      if (s === 9) return 'Kl. Septime';
      if (s === 10) return 'Kl. Septime';
      if (s === 11) return 'Gr. Septime';
      if (s === 12) return 'Oktave';
      return `+${s} HT`;
    })();
    return {
      degree: degreeLabel,
      interval,
      note: toGerman(Note.get(note).pc ?? note),
      semitones: semis,
    };
  });

  return {
    root,
    quality,
    symbol: chord.symbol,
    notes: chord.notes.map(n => toGerman(n)),
    tones,
  };
}

// ── Circle of Fifths ─────────────────────────────────────────────────────────

export interface CircleEntry {
  index: number;       // 0–11, clockwise from C at top
  major: string;       // English pitch class, e.g. 'G'
  majorDE: string;     // German display name
  minor: string;       // English, e.g. 'e'
  minorDE: string;     // German display
  sharps: number;      // positive = sharps, negative = flats
  signature: string;   // '##', 'bb', etc.
}

// Clockwise order starting from C (top)
const CIRCLE_MAJORS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const CIRCLE_MINORS = ['a', 'e', 'b', 'f#', 'c#', 'g#', 'd#', 'bb', 'f', 'c', 'g', 'd'];
const CIRCLE_SIGS = [0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1]; // +n = n sharps, -n = n flats

export const CIRCLE_DATA: CircleEntry[] = CIRCLE_MAJORS.map((major, i) => ({
  index: i,
  major,
  majorDE: toGerman(major),
  minor: CIRCLE_MINORS[i],
  minorDE: toGerman(CIRCLE_MINORS[i].charAt(0).toUpperCase() + CIRCLE_MINORS[i].slice(1)).toLowerCase(),
  sharps: CIRCLE_SIGS[i],
  signature: (() => {
    const n = CIRCLE_SIGS[i];
    if (n === 0) return '—';
    if (n > 0) return '#'.repeat(n);
    return 'b'.repeat(-n);
  })(),
}));

// ── Chromatic Notes for Selects ──────────────────────────────────────────────

export const CHROMATIC_NOTES = [
  { value: 'C', label: 'C' },
  { value: 'Db', label: 'Des' },
  { value: 'D', label: 'D' },
  { value: 'Eb', label: 'Es' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'Gb', label: 'Ges' },
  { value: 'G', label: 'G' },
  { value: 'Ab', label: 'As' },
  { value: 'A', label: 'A' },
  { value: 'Bb', label: 'B' },
  { value: 'B', label: 'H' },
];

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMusicEngine() {
  return {
    toGerman,
    toGermanWithOctave,
    writtenToConcert,
    concertToWritten,
    getScaleInfo,
    getChordInfo,
    CIRCLE_DATA,
    INSTRUMENTS,
    CHROMATIC_NOTES,
    SCALE_MODES,
    CHORD_QUALITIES,
  };
}
