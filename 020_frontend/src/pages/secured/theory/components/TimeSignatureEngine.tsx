import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Play, Square, ChevronDown } from 'lucide-react';

// ── Data model ───────────────────────────────────────────────────────────────

type Category = 'Einfach' | 'Zusammengesetzt' | 'Asymmetrisch' | 'Sonderform';

interface TimeSigDef {
  id: string;
  label: string;
  numerator: number;
  denominator: number;
  category: Category;
  description: string;
  defaultGroups: number[];    // e.g. [2,2,3] for 7/8
  groupingOptions?: number[][]; // alternative groupings
  dirPattern: string;          // e.g. "↓ ↑" or "↓ → ↑"
  beatUnit: string;
  feel: string;
}

const TIME_SIGNATURES: TimeSigDef[] = [
  // Simple
  { id: '2/4',  label: '2/4',  numerator: 2,  denominator: 4, category: 'Einfach', description: 'Zweiertakt – Marsch, Polka', defaultGroups: [1,1], dirPattern: '↓ ↑', beatUnit: 'Viertelnote', feel: 'Gerade, kraftvoll' },
  { id: '3/4',  label: '3/4',  numerator: 3,  denominator: 4, category: 'Einfach', description: 'Dreiertakt – Walzer, Ländler', defaultGroups: [1,1,1], dirPattern: '↓ → ↑', beatUnit: 'Viertelnote', feel: 'Strömend, tänzerisch' },
  { id: '4/4',  label: '4/4',  numerator: 4,  denominator: 4, category: 'Einfach', description: 'Viertakt – Standard, Rock, Pop', defaultGroups: [1,1,1,1], dirPattern: '↓ → ↑ ←', beatUnit: 'Viertelnote', feel: 'Ausgeglichen, breit' },
  { id: '2/2',  label: '2/2',  numerator: 2,  denominator: 2, category: 'Einfach', description: 'Alla Breve – schnelle Musik', defaultGroups: [1,1], dirPattern: '↓ ↑', beatUnit: 'Halbenote', feel: 'Gerade, breit' },
  { id: '3/2',  label: '3/2',  numerator: 3,  denominator: 2, category: 'Einfach', description: 'Langsamer Dreiertakt – Barockmusik', defaultGroups: [1,1,1], dirPattern: '↓ → ↑', beatUnit: 'Halbenote', feel: 'Weiträumig, feierlich' },
  { id: '3/8',  label: '3/8',  numerator: 3,  denominator: 8, category: 'Einfach', description: 'Leichter Dreiertakt – Menuett', defaultGroups: [1,1,1], dirPattern: '↓ → ↑', beatUnit: 'Achtelnote', feel: 'Leicht, elegant' },

  // Compound
  { id: '6/8',  label: '6/8',  numerator: 6,  denominator: 8, category: 'Zusammengesetzt', description: '2×3 – Siciliana, 6/8-Marsch', defaultGroups: [3,3], dirPattern: '↓ ↑', beatUnit: '3 Achtel', feel: 'Wiegend, fliessend' },
  { id: '9/8',  label: '9/8',  numerator: 9,  denominator: 8, category: 'Zusammengesetzt', description: '3×3 – Compound-Dreiertakt', defaultGroups: [3,3,3], dirPattern: '↓ → ↑', beatUnit: '3 Achtel', feel: 'Weit, dreigliedrig' },
  { id: '12/8', label: '12/8', numerator: 12, denominator: 8, category: 'Zusammengesetzt', description: '4×3 – Blues, Barcarole', defaultGroups: [3,3,3,3], dirPattern: '↓ → ↑ ←', beatUnit: '3 Achtel', feel: 'Wiegend, breit' },

  // Asymmetric
  {
    id: '5/4', label: '5/4', numerator: 5, denominator: 4, category: 'Asymmetrisch',
    description: 'Fünfertakt – Take Five (Brubeck)', defaultGroups: [3,2],
    groupingOptions: [[3,2],[2,3]],
    dirPattern: '↓ → ↑', beatUnit: 'Viertelnote', feel: 'Uneben, spannend',
  },
  {
    id: '7/4', label: '7/4', numerator: 7, denominator: 4, category: 'Asymmetrisch',
    description: 'Siebentakt – Pink Floyd "Money" (7/8)', defaultGroups: [4,3],
    groupingOptions: [[4,3],[3,4],[2,2,3],[2,3,2],[3,2,2]],
    dirPattern: '↓ → ↑', beatUnit: 'Viertelnote', feel: 'Komplex, treibend',
  },
  {
    id: '5/8', label: '5/8', numerator: 5, denominator: 8, category: 'Asymmetrisch',
    description: 'Asymmetrischer Fünfertakt', defaultGroups: [3,2],
    groupingOptions: [[3,2],[2,3]],
    dirPattern: '↓ ↑', beatUnit: 'Achtelnote', feel: 'Unruhig, charakterstark',
  },
  {
    id: '7/8', label: '7/8', numerator: 7, denominator: 8, category: 'Asymmetrisch',
    description: 'Siebener-Achtel – Balkan-Musik', defaultGroups: [2,2,3],
    groupingOptions: [[2,2,3],[2,3,2],[3,2,2]],
    dirPattern: '↓ → ↑', beatUnit: 'Achtelnote', feel: 'Tanzend, uneben',
  },
  {
    id: '11/8', label: '11/8', numerator: 11, denominator: 8, category: 'Asymmetrisch',
    description: 'Elfer-Achtel – Avantgarde/Folk', defaultGroups: [3,3,2,3],
    groupingOptions: [[3,3,2,3],[3,2,3,3],[2,3,3,3],[3,3,3,2]],
    dirPattern: '↓ → ↑ ←', beatUnit: 'Achtelnote', feel: 'Sehr komplex, vielschichtig',
  },

  // Special
  { id: 'C',  label: 'C (4/4)',  numerator: 4, denominator: 4, category: 'Sonderform', description: 'Common Time – identisch mit 4/4', defaultGroups: [1,1,1,1], dirPattern: '↓ → ↑ ←', beatUnit: 'Viertelnote', feel: 'Standard' },
  { id: 'cut', label: '𝄵 (2/2)', numerator: 2, denominator: 2, category: 'Sonderform', description: 'Alla Breve / Cut Time – identisch mit 2/2', defaultGroups: [1,1], dirPattern: '↓ ↑', beatUnit: 'Halbenote', feel: 'Schnell, breit' },
];

const CATEGORIES: Category[] = ['Einfach', 'Zusammengesetzt', 'Asymmetrisch', 'Sonderform'];
const CATEGORY_COLORS: Record<Category, string> = {
  'Einfach':           'var(--color-green-800)',
  'Zusammengesetzt':   'var(--color-blue-900)',
  'Asymmetrisch':      'var(--color-orange-800)',
  'Sonderform':        'var(--color-purple-900)',
};

// ── Beat Visualizer (animated) ───────────────────────────────────────────────

interface BeatVizProps {
  groups: number[];
  activeBeat: number;  // -1 = stopped
  denominator: number;
  color?: string;
}

function BeatVisualizer({ groups, activeBeat, denominator, color = 'var(--color-green-800)' }: BeatVizProps) {
  const slots: { groupIdx: number; posInGroup: number; isAccent: boolean }[] = [];
  groups.forEach((size, gi) => {
    for (let p = 0; p < size; p++) {
      slots.push({ groupIdx: gi, posInGroup: p, isAccent: p === 0 });
    }
  });

  return (
    <div className="flex flex-wrap gap-2 items-end">
      {slots.map((s, i) => {
        const isActive = activeBeat === i;
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            {/* Accent marker */}
            {s.isAccent && (
              <div className="text-[9px] text-gray-400 font-bold leading-none">›</div>
            )}
            {/* Beat dot */}
            <motion.div
              animate={{
                scale: isActive ? 1.4 : 1,
                opacity: isActive ? 1 : 0.35,
              }}
              transition={{ duration: 0.08 }}
              className="rounded-full transition-colors"
              style={{
                width: s.isAccent ? 20 : 14,
                height: s.isAccent ? 20 : 14,
                background: isActive ? color : s.isAccent ? `${color}80` : '#d1d5db',
                boxShadow: isActive ? `0 0 8px ${color}60` : 'none',
              }}
            />
            {/* Beat number */}
            <div className="text-[9px] text-gray-400 leading-none">{i + 1}</div>
          </div>
        );
      })}

      {/* Note value legend */}
      <div className="ml-2 text-[10px] text-gray-400 self-end pb-4">
        ♩ = {denominator === 4 ? '¼' : denominator === 8 ? '⅛' : '½'}
      </div>
    </div>
  );
}

// ── Conducting pattern SVG ───────────────────────────────────────────────────

function ConductPattern({ pattern }: { pattern: string }) {
  const steps = pattern.split(' ');
  return (
    <div className="flex items-center gap-1 text-sm font-mono text-gray-600 bg-gray-100 rounded-lg px-3 py-1.5">
      <span className="text-[10px] text-gray-400 mr-1">Dirigiermuster:</span>
      {steps.map((s, i) => (
        <span key={i} className="text-green-800 font-bold">{s}</span>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface Props {
  onSendToMetronome?: (timeSig: string) => void;
}

export function TimeSignatureEngine({ onSendToMetronome }: Props) {
  const [selected, setSelected] = useState<TimeSigDef>(TIME_SIGNATURES[2]); // 4/4
  const [groups, setGroups] = useState<number[]>(TIME_SIGNATURES[2].defaultGroups);
  const [activeBeat, setActiveBeat] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [activeCategory, setActiveCategory] = useState<Category | 'Alle'>('Alle');

  // Refs for scheduler (avoid stale closures)
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const beatRef       = useRef(0);
  const bpmRef        = useRef(bpm);
  const totalBeatsRef = useRef(groups.reduce((a, b) => a + b, 0));
  const groupsRef     = useRef(groups);
  const denominatorRef = useRef(selected.denominator);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => {
    groupsRef.current = groups;
    totalBeatsRef.current = groups.reduce((a, b) => a + b, 0);
  }, [groups]);
  useEffect(() => { denominatorRef.current = selected.denominator; }, [selected.denominator]);

  // Build accent map: 2=main, 1=sub, 0=normal
  function getAccentLevel(beat: number, currentGroups: number[]): 0 | 1 | 2 {
    let pos = 0;
    for (let gi = 0; gi < currentGroups.length; gi++) {
      if (beat === pos) return gi === 0 ? 2 : 1;
      pos += currentGroups[gi];
    }
    return 0;
  }

  function scheduleClick(time: number, accentLevel: 0 | 1 | 2) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = accentLevel === 2 ? 1100 : accentLevel === 1 ? 880 : 660;
    const vol = accentLevel === 2 ? 0.7 : accentLevel === 1 ? 0.5 : 0.35;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  const nextNoteTimeRef = useRef(0);
  const LOOKAHEAD = 0.1;

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const beatDuration = (60 / bpmRef.current) * (4 / denominatorRef.current);
    while (nextNoteTimeRef.current < ctx.currentTime + LOOKAHEAD) {
      const beat = beatRef.current;
      const level = getAccentLevel(beat, groupsRef.current);
      scheduleClick(nextNoteTimeRef.current, level);
      const noteTime = nextNoteTimeRef.current;
      const delay = Math.max(0, (noteTime - ctx.currentTime) * 1000);
      setTimeout(() => setActiveBeat(beat), delay);
      nextNoteTimeRef.current += beatDuration;
      beatRef.current = (beat + 1) % totalBeatsRef.current;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    beatRef.current = 0;
    intervalRef.current = setInterval(scheduler, 25);
    setIsPlaying(true);
  }, [scheduler]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    intervalRef.current = null;
    setIsPlaying(false);
    setActiveBeat(-1);
    beatRef.current = 0;
  }, []);

  const startStop = useCallback(() => {
    if (isPlaying) stop(); else start();
  }, [isPlaying, stop, start]);

  useEffect(() => () => { stop(); }, [stop]);

  function selectTimeSig(ts: TimeSigDef) {
    stop();
    setSelected(ts);
    setGroups(ts.defaultGroups);
  }

  const filtered = activeCategory === 'Alle'
    ? TIME_SIGNATURES
    : TIME_SIGNATURES.filter(t => t.category === activeCategory);

  const categoryColor = CATEGORY_COLORS[selected.category];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-gray-500">
        Taktarten analysieren, Betonungsmuster verstehen, animiert dirigieren.
      </p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {(['Alle', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
              activeCategory === cat
                ? 'text-white border-transparent'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            )}
            style={activeCategory === cat ? { background: cat === 'Alle' ? 'var(--color-green-800)' : CATEGORY_COLORS[cat as Category] } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Time sig selector */}
      <div className="flex flex-wrap gap-1.5">
        {filtered.map(ts => (
          <button
            key={ts.id}
            onClick={() => selectTimeSig(ts)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all',
              selected.id === ts.id
                ? 'text-white border-transparent shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            )}
            style={selected.id === ts.id ? { background: CATEGORY_COLORS[ts.category] } : {}}
          >
            {ts.label}
          </button>
        ))}
      </div>

      {/* Detail card */}
      <div
        className="rounded-xl p-4 text-white flex flex-col gap-3"
        style={{ background: categoryColor }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold font-mono leading-none">{selected.label}</div>
            <div className="text-sm opacity-80 mt-1">{selected.description}</div>
          </div>
          <div className="text-right text-xs opacity-70 space-y-0.5">
            <div>Schlageinheit: {selected.beatUnit}</div>
            <div>Charakter: {selected.feel}</div>
            <div>Kategorie: {selected.category}</div>
          </div>
        </div>

        <ConductPattern pattern={selected.dirPattern} />
      </div>

      {/* Grouping options for asymmetric */}
      {selected.groupingOptions && selected.groupingOptions.length > 1 && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600">Betonungsgruppe wählen:</label>
          <div className="flex flex-wrap gap-2">
            {selected.groupingOptions.map((g, i) => (
              <button
                key={i}
                onClick={() => { stop(); setGroups(g); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  JSON.stringify(groups) === JSON.stringify(g)
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                )}
                style={JSON.stringify(groups) === JSON.stringify(g) ? { background: categoryColor } : {}}
              >
                {g.join(' + ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Beat visualizer */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-600">Betonungsmuster ({groups.join('+')})</div>
          <div className="flex items-center gap-2">
            <input
              type="range" min={40} max={240} value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-24 accent-green-300 h-1.5"
            />
            <span className="text-xs font-mono text-gray-600 w-12">{bpm} BPM</span>
          </div>
        </div>

        <BeatVisualizer groups={groups} activeBeat={activeBeat} denominator={selected.denominator} color={categoryColor} />

        <div className="flex gap-2">
          <button
            onClick={startStop}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'text-white'
            )}
            style={!isPlaying ? { background: categoryColor } : {}}
          >
            {isPlaying
              ? <><Square className="h-3.5 w-3.5 fill-current" /> Stopp</>
              : <><Play className="h-3.5 w-3.5 fill-current" /> Abspielen</>}
          </button>

          {onSendToMetronome && (
            <button
              onClick={() => onSendToMetronome(selected.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:border-green-300 transition-all"
            >
              🎵 Im Metronom öffnen
            </button>
          )}
        </div>
      </div>

      {/* Static reference table */}
      <details className="bg-gray-50 rounded-xl border border-gray-100">
        <summary className="px-4 py-3 text-xs font-semibold text-gray-600 cursor-pointer select-none flex items-center gap-2">
          <ChevronDown className="h-3.5 w-3.5" />
          Vollständige Taktarten-Referenztabelle
        </summary>
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="text-xs w-full mt-2">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">Takt</th>
                <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">Kategorie</th>
                <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">Gruppierung</th>
                <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">Dirigier-Schlag</th>
                <th className="text-left py-1.5 text-gray-500 font-medium">Charakter / Anwendung</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {TIME_SIGNATURES.map(ts => (
                <tr
                  key={ts.id}
                  className="border-b border-gray-100 hover:bg-gray-100/50 transition-colors cursor-pointer"
                  onClick={() => selectTimeSig(ts)}
                >
                  <td className="py-1.5 pr-3 font-bold font-mono"
                    style={{ color: CATEGORY_COLORS[ts.category] }}>{ts.label}</td>
                  <td className="py-1.5 pr-3">{ts.category}</td>
                  <td className="py-1.5 pr-3 font-mono">{ts.defaultGroups.join('+')}</td>
                  <td className="py-1.5 pr-3 font-mono text-gray-500">{ts.dirPattern}</td>
                  <td className="py-1.5 text-gray-500">{ts.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
