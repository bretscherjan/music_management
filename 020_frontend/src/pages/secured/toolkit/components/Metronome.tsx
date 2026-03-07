import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Square, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type TimeSignature = '2/4' | '3/4' | '4/4' | '6/8';

const TIME_SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '6/8'];

const BEATS_PER_SIG: Record<TimeSignature, number> = {
  '2/4': 2,
  '3/4': 3,
  '4/4': 4,
  '6/8': 6,
};

// ── AudioContext Metronome ───────────────────────────────────────────────────

const LOOKAHEAD = 0.1;     // seconds
const SCHEDULE_INTERVAL = 25; // ms

function scheduleClick(ctx: AudioContext, time: number, isAccent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = isAccent ? 1100 : 660;
  gain.gain.setValueAtTime(isAccent ? 0.8 : 0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  osc.start(time);
  osc.stop(time + 0.1);
}

// ── Component ────────────────────────────────────────────────────────────────

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number>(-1);
  const [timeSig, setTimeSig] = useState<TimeSignature>('4/4');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bpmRef = useRef(bpm);
  const timeSigRef = useRef(timeSig);
  const beatsRef = useRef(BEATS_PER_SIG[timeSig]);

  // Keep refs in sync
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => {
    timeSigRef.current = timeSig;
    beatsRef.current = BEATS_PER_SIG[timeSig];
  }, [timeSig]);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    while (nextNoteTimeRef.current < ctx.currentTime + LOOKAHEAD) {
      const beat = currentBeatRef.current;
      scheduleClick(ctx, nextNoteTimeRef.current, beat === 0);
      // Update visual beat with slight delay to match audio
      const noteTime = nextNoteTimeRef.current;
      const delay = Math.max(0, (noteTime - ctx.currentTime) * 1000);
      setTimeout(() => setCurrentBeat(beat), delay);
      nextNoteTimeRef.current += 60 / bpmRef.current;
      currentBeatRef.current = (beat + 1) % beatsRef.current;
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

  const toggle = useCallback(() => {
    if (isPlaying) stop(); else start();
  }, [isPlaying, start, stop]);

  useEffect(() => () => { stop(); }, [stop]);

  // ── Tap Tempo ──────────────────────────────────────────────────────────────
  const tapTimesRef = useRef<number[]>([]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    // Reset if last tap was > 3 seconds ago
    if (taps.length > 0 && now - taps[taps.length - 1] > 3000) {
      tapTimesRef.current = [];
    }
    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      setBpm(Math.max(20, Math.min(300, newBpm)));
    }
  }, []);

  const beats = BEATS_PER_SIG[timeSig];
  const bpmColor = bpm < 60 ? '#9ca3af' : bpm < 100 ? '#405116' : bpm < 160 ? '#BDD18C' : '#ef4444';

  return (
    <div className="flex flex-col gap-6">

      {/* ── Time Signature ── */}
      <div className="flex gap-2">
        {TIME_SIGNATURES.map(ts => (
          <button
            key={ts}
            onClick={() => { setTimeSig(ts); if (isPlaying) { stop(); } }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
              timeSig === ts
                ? 'bg-[#BDD18C] text-[#405116] border-[#405116]/30 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#BDD18C]'
            )}
          >
            {ts}
          </button>
        ))}
      </div>

      {/* ── Beat Indicators ── */}
      <div className="flex items-center justify-center gap-3">
        {Array.from({ length: beats }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-75',
              i === 0 ? 'w-7 h-7' : 'w-5 h-5',
              isPlaying && currentBeat === i
                ? i === 0
                  ? 'bg-[#405116] scale-125 shadow-lg shadow-[#405116]/30'
                  : 'bg-[#BDD18C] scale-125 shadow-md shadow-[#BDD18C]/50'
                : 'bg-gray-200'
            )}
          />
        ))}
      </div>

      {/* ── BPM Display ── */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-7xl font-bold tracking-tighter" style={{ color: bpmColor }}>
          {bpm}
        </div>
        <div className="text-sm text-gray-400 font-medium">BPM</div>
        <div className="text-xs text-gray-400">{tempoLabel(bpm)}</div>
      </div>

      {/* ── BPM Slider ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setBpm(b => Math.max(20, b - 1))}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
        >−</button>
        <input
          type="range"
          min={20} max={300} value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
          className="flex-1 accent-[#BDD18C] h-2"
        />
        <button
          onClick={() => setBpm(b => Math.min(300, b + 1))}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
        >+</button>
      </div>

      {/* ── BPM Presets ── */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[60, 72, 80, 90, 96, 100, 108, 120, 132, 144, 160].map(b => (
          <button
            key={b}
            onClick={() => setBpm(b)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
              bpm === b
                ? 'bg-[#BDD18C] text-[#405116] border-[#405116]/20'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#BDD18C]'
            )}
          >
            {b}
          </button>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={toggle}
          size="lg"
          className={cn(
            'gap-2 px-10 transition-all',
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-[#405116] hover:bg-[#405116]/90 text-white'
          )}
        >
          {isPlaying ? <Square className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
          {isPlaying ? 'Stopp' : 'Start'}
        </Button>

        <Button
          onClick={handleTap}
          variant="outline"
          size="lg"
          className="gap-2 px-6 border-[#BDD18C] text-[#405116] hover:bg-[#BDD18C]/10 active:scale-95 transition-all select-none"
        >
          <Music className="h-4 w-4" />
          Tap Tempo
        </Button>
      </div>

      <p className="text-xs text-gray-400 text-center">
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
