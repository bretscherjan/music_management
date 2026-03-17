import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Square, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Time signature data ──────────────────────────────────────────────────────

type TSCategory = 'Einfach' | 'Zusammengesetzt' | 'Asymmetrisch' | 'Sonderform';

interface TSConfig {
  id: string;
  label: string;
  totalBeats: number;          // subdivisions per bar
  defaultGroups: number[];     // accent group sizes
  groupingOptions?: number[][];
  category: TSCategory;
  denominator: number;
}

const ALL_TIME_SIGNATURES: TSConfig[] = [
  // Simple
  { id: '2/4',  label: '2/4',  totalBeats: 2,  defaultGroups: [1,1],     category: 'Einfach',           denominator: 4 },
  { id: '3/4',  label: '3/4',  totalBeats: 3,  defaultGroups: [1,1,1],   category: 'Einfach',           denominator: 4 },
  { id: '4/4',  label: '4/4',  totalBeats: 4,  defaultGroups: [1,1,1,1], category: 'Einfach',           denominator: 4 },
  { id: '2/2',  label: '2/2',  totalBeats: 2,  defaultGroups: [1,1],     category: 'Einfach',           denominator: 2 },
  { id: '3/8',  label: '3/8',  totalBeats: 3,  defaultGroups: [1,1,1],   category: 'Einfach',           denominator: 8 },
  // Compound
  { id: '6/8',  label: '6/8',  totalBeats: 6,  defaultGroups: [3,3],     category: 'Zusammengesetzt',   denominator: 8 },
  { id: '9/8',  label: '9/8',  totalBeats: 9,  defaultGroups: [3,3,3],   category: 'Zusammengesetzt',   denominator: 8 },
  { id: '12/8', label: '12/8', totalBeats: 12, defaultGroups: [3,3,3,3], category: 'Zusammengesetzt',   denominator: 8 },
  // Asymmetric
  {
    id: '5/4',  label: '5/4',  totalBeats: 5,  defaultGroups: [3,2],
    groupingOptions: [[3,2],[2,3]],
    category: 'Asymmetrisch', denominator: 4,
  },
  {
    id: '7/4',  label: '7/4',  totalBeats: 7,  defaultGroups: [4,3],
    groupingOptions: [[4,3],[3,4],[2,2,3],[2,3,2],[3,2,2]],
    category: 'Asymmetrisch', denominator: 4,
  },
  {
    id: '5/8',  label: '5/8',  totalBeats: 5,  defaultGroups: [3,2],
    groupingOptions: [[3,2],[2,3]],
    category: 'Asymmetrisch', denominator: 8,
  },
  {
    id: '7/8',  label: '7/8',  totalBeats: 7,  defaultGroups: [2,2,3],
    groupingOptions: [[2,2,3],[2,3,2],[3,2,2]],
    category: 'Asymmetrisch', denominator: 8,
  },
  {
    id: '11/8', label: '11/8', totalBeats: 11, defaultGroups: [3,3,2,3],
    groupingOptions: [[3,3,2,3],[3,2,3,3],[2,3,3,3],[3,3,3,2]],
    category: 'Asymmetrisch', denominator: 8,
  },
];

const CATEGORY_ORDER: TSCategory[] = ['Einfach', 'Zusammengesetzt', 'Asymmetrisch'];
const CATEGORY_COLOR: Record<TSCategory, string> = {
  'Einfach': 'var(--color-brand-primary)',
  'Zusammengesetzt': 'var(--color-blue-900)',
  'Asymmetrisch': 'var(--color-orange-800)',
  'Sonderform': 'var(--color-purple-900)',
};

// ── AudioContext Metronome ───────────────────────────────────────────────────

const LOOKAHEAD = 0.1;
const SCHEDULE_INTERVAL = 25;

function scheduleClick(ctx: AudioContext, time: number, accentLevel: 0 | 1 | 2) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  // 2 = main accent (bar downbeat), 1 = sub-accent (compound group), 0 = normal
  osc.frequency.value = accentLevel === 2 ? 1100 : accentLevel === 1 ? 880 : 660;
  const vol = accentLevel === 2 ? 0.8 : accentLevel === 1 ? 0.6 : 0.4;
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.start(time);
  osc.stop(time + 0.1);
}

/** Build a flat array of accent levels (0|1|2) from group config */
function buildAccentMap(groups: number[]): Array<0 | 1 | 2> {
  const map: Array<0 | 1 | 2> = [];
  groups.forEach((size, gi) => {
    for (let p = 0; p < size; p++) {
      if (p === 0 && gi === 0) map.push(2);       // main accent
      else if (p === 0) map.push(1);               // sub-accent
      else map.push(0);                            // normal
    }
  });
  return map;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialTimeSig?: string;
}

export function Metronome({ initialTimeSig }: Props) {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number>(-1);

  const defaultTS = ALL_TIME_SIGNATURES.find(t => t.id === initialTimeSig) ?? ALL_TIME_SIGNATURES[2];
  const [timeSig, setTimeSig] = useState<TSConfig>(defaultTS);
  const [groups, setGroups] = useState<number[]>(defaultTS.defaultGroups);

  const accentMap = buildAccentMap(groups);
  const totalBeats = groups.reduce((a, b) => a + b, 0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bpmRef = useRef(bpm);
  const totalBeatsRef = useRef(totalBeats);
  const accentMapRef = useRef(accentMap);
  const denominatorRef = useRef(timeSig.denominator);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { totalBeatsRef.current = totalBeats; }, [totalBeats]);
  useEffect(() => { accentMapRef.current = accentMap; }, [accentMap]);
  useEffect(() => { denominatorRef.current = timeSig.denominator; }, [timeSig.denominator]);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    // Beat duration depends on denominator (quarter = 60/bpm, eighth = 30/bpm, half = 120/bpm)
    const beatDuration = (60 / bpmRef.current) * (4 / denominatorRef.current);
    while (nextNoteTimeRef.current < ctx.currentTime + LOOKAHEAD) {
      const beat = currentBeatRef.current;
      scheduleClick(ctx, nextNoteTimeRef.current, accentMapRef.current[beat] ?? 0);
      const noteTime = nextNoteTimeRef.current;
      const delay = Math.max(0, (noteTime - ctx.currentTime) * 1000);
      setTimeout(() => setCurrentBeat(beat), delay);
      nextNoteTimeRef.current += beatDuration;
      currentBeatRef.current = (beat + 1) % totalBeatsRef.current;
    }
  }, []);

  const start = useCallback(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    currentBeatRef.current = 0;
    intervalRef.current = setInterval(scheduler, SCHEDULE_INTERVAL);
    setIsPlaying(true);
    setCurrentBeat(0);
  }, [scheduler]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    intervalRef.current = null;
    setIsPlaying(false);
    setCurrentBeat(-1);
  }, []);

  const toggle = useCallback(() => { if (isPlaying) stop(); else start(); }, [isPlaying, start, stop]);
  useEffect(() => () => { stop(); }, [stop]);

  function selectTimeSig(ts: TSConfig) {
    stop();
    setTimeSig(ts);
    setGroups(ts.defaultGroups);
  }

  // ── Tap Tempo ───────────────────────────────────────────────────────────────
  const tapTimesRef = useRef<number[]>([]);
  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 3000) tapTimesRef.current = [];
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++)
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.max(20, Math.min(300, Math.round(60000 / avg))));
    }
  }, []);

  const bpmColor = bpm < 60 ? 'var(--color-gray-400)' : bpm < 100 ? 'var(--color-brand-primary)' : bpm < 160 ? 'var(--color-brand-primary/50)' : 'var(--color-red-500)';
  const activeCatColor = CATEGORY_COLOR[timeSig.category];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Time Signature selector by category ── */}
      <div className="flex flex-col gap-2">
        {CATEGORY_ORDER.map(cat => (
          <div key={cat} className="flex flex-col gap-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: CATEGORY_COLOR[cat] }}>
              {cat}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TIME_SIGNATURES.filter(ts => ts.category === cat).map(ts => (
                <button
                  key={ts.id}
                  onClick={() => selectTimeSig(ts)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                    timeSig.id === ts.id
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-card text-muted-foreground border-border/50 hover:border-border'
                  )}
                  style={timeSig.id === ts.id ? { background: CATEGORY_COLOR[cat] } : {}}
                >
                  {ts.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Grouping for asymmetric ── */}
      {timeSig.groupingOptions && timeSig.groupingOptions.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-medium text-gray-600">Betonungsgruppe:</div>
          <div className="flex flex-wrap gap-1.5">
            {timeSig.groupingOptions.map((g, i) => (
              <button
                key={i}
                onClick={() => { stop(); setGroups(g); }}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-mono border transition-all',
                  JSON.stringify(groups) === JSON.stringify(g)
                    ? 'text-white border-transparent'
                    : 'bg-card text-muted-foreground border-border/50 hover:border-muted-foreground'
                )}
                style={JSON.stringify(groups) === JSON.stringify(g) ? { background: activeCatColor } : {}}
              >
                {g.join('+')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Beat indicators ── */}
      <div className="flex items-end justify-center flex-wrap gap-2 min-h-[40px]">
        {accentMap.map((level, i) => {
          const isActive = isPlaying && currentBeat === i;
          const size = level === 2 ? 'w-7 h-7' : level === 1 ? 'w-6 h-6' : 'w-4 h-4';
          return (
            <div
              key={i}
              className={cn('rounded-full transition-all duration-75', size)}
              style={{
                background: isActive
                  ? (level === 2 ? activeCatColor : level === 1 ? `${activeCatColor}cc` : 'var(--color-brand-primary/50)')
                  : 'var(--color-gray-200)',
                transform: isActive ? 'scale(1.3)' : 'scale(1)',
                boxShadow: isActive ? `0 0 8px ${activeCatColor}50` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* ── BPM Display ── */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-7xl font-bold tracking-tighter" style={{ color: bpmColor }}>{bpm}</div>
        <div className="text-sm text-muted-foreground font-medium">BPM</div>
        <div className="text-xs text-muted-foreground">{tempoLabel(bpm)}</div>
      </div>

      {/* ── BPM Slider ── */}
      <div className="flex items-center gap-3">
        <button onClick={() => setBpm(b => Math.max(20, b - 1))} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 text-foreground font-bold text-lg transition-colors flex items-center justify-center">−</button>
        <input type="range" min={20} max={300} value={bpm} onChange={e => setBpm(Number(e.target.value))} className="flex-1 accent-primary/50 h-2" />
        <button onClick={() => setBpm(b => Math.min(300, b + 1))} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 text-foreground font-bold text-lg transition-colors flex items-center justify-center">+</button>
      </div>

      {/* ── BPM Presets ── */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[60, 72, 80, 90, 96, 100, 108, 120, 132, 144, 160].map(b => (
          <button key={b} onClick={() => setBpm(b)} className={cn('px-2.5 py-1 rounded-md text-xs font-medium border transition-all', bpm === b ? 'bg-primary/50 text-primary border-primary/20' : 'bg-card text-muted-foreground border-border/50 hover:border-primary/50')}>{b}</button>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={toggle}
          size="lg"
          className={cn('gap-2 px-10 transition-all', isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-white')}
          style={!isPlaying ? { background: activeCatColor } : {}}
        >
          {isPlaying ? <Square className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
          {isPlaying ? 'Stopp' : 'Start'}
        </Button>
        <Button onClick={handleTap} variant="outline" size="lg" className="gap-2 px-6 border-primary/50 text-primary hover:bg-primary/10 active:scale-95 transition-all select-none">
          <Music className="h-4 w-4" />
          Tap Tempo
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Tippe mehrfach auf "Tap Tempo" um das BPM automatisch zu berechnen.
      </p>
    </div>
  );
}

// ── Tempo Label ──────────────────────────────────────────────────────────────

function tempoLabel(bpm: number): string {
  if (bpm < 40)  return 'Larghissimo';
  if (bpm < 60)  return 'Largo';
  if (bpm < 66)  return 'Larghetto';
  if (bpm < 76)  return 'Adagio';
  if (bpm < 108) return 'Andante';
  if (bpm < 120) return 'Moderato';
  if (bpm < 156) return 'Allegro';
  if (bpm < 176) return 'Vivace';
  if (bpm < 200) return 'Presto';
  return 'Prestissimo';
}
