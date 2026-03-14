import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Music Theory Helpers ────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Convert Hz → { note, octave, cents deviation } */
function frequencyToNote(freq: number) {
  const semitones = 12 * Math.log2(freq / 440); // semitones from A4
  const rounded = Math.round(semitones);
  const cents = Math.round((semitones - rounded) * 100);
  // A4 → rounded=0, noteIndex=9, octave=4
  const noteIndex = ((rounded % 12) + 12 + 9) % 12;
  const octave = 4 + Math.floor((rounded + 9) / 12);
  return { note: NOTE_NAMES[noteIndex], octave, cents };
}

/** Convert note index (0=C) + octave → Hz */
function noteToFrequency(noteIndex: number, octave: number): number {
  const semisFromA4 = (noteIndex - 9) + (octave - 4) * 12;
  return 440 * Math.pow(2, semisFromA4 / 12);
}

// ── Pitch Detection (MPM – McLeod Pitch Method) ──────────────────────────────

function detectPitch(buffer: Float32Array<ArrayBuffer>, sampleRate: number): number {
  const n = buffer.length;

  // RMS check – reject silence / very quiet input
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.01) return -1;

  // Limit lag search to audible musical range 50 Hz – 2 kHz
  const minLag = Math.floor(sampleRate / 2000);
  const maxLag = Math.min(Math.floor(sampleRate / 50), Math.floor(n / 2));
  const nsdfLen = maxLag - minLag + 1;

  // Compute NSDF (normalised autocorrelation) for every lag and track global max
  const nsdf = new Float32Array(nsdfLen);
  let globalMax = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let num = 0, denom = 0;
    for (let i = 0; i < n - lag; i++) {
      num += buffer[i] * buffer[i + lag];
      denom += buffer[i] * buffer[i] + buffer[i + lag] * buffer[i + lag];
    }
    const val = denom > 0 ? 2 * num / denom : 0;
    nsdf[lag - minLag] = val;
    if (val > globalMax) globalMax = val;
  }

  // Reject weak / noisy signals
  if (globalMax < 0.4) return -1;

  // MPM key insight: the fundamental period is the FIRST local maximum above
  // KEY * globalMax — NOT the global maximum (which is often a harmonic).
  const threshold = 0.86 * globalMax;
  let bestLag = -1;

  for (let i = 1; i < nsdfLen - 1; i++) {
    if (nsdf[i] >= nsdf[i - 1] && nsdf[i] > nsdf[i + 1] && nsdf[i] >= threshold) {
      bestLag = i + minLag;
      break; // first peak above threshold = fundamental, stop here
    }
  }

  // Fallback to global max if no peak was found above threshold
  if (bestLag < 0) {
    for (let i = 0; i < nsdfLen; i++) {
      if (nsdf[i] === globalMax) { bestLag = i + minLag; break; }
    }
    if (globalMax < 0.6) return -1;
  }

  // Parabolic interpolation for sub-sample accuracy
  const idx = bestLag - minLag;
  if (idx > 0 && idx < nsdfLen - 1) {
    const a = nsdf[idx - 1], b = nsdf[idx], c = nsdf[idx + 1];
    const denom2 = 2 * b - a - c;
    const delta = denom2 > 0 ? (c - a) / (2 * denom2) : 0;
    return sampleRate / (bestLag + delta);
  }
  return sampleRate / bestLag;
}

// ── Transposition Config ────────────────────────────────────────────────────

type TransposeKey = 'C' | 'B' | 'Es' | 'F';

const TRANSPOSE_OFFSETS: Record<TransposeKey, number> = {
  C: 0,   // concert pitch
  B: 2,   // Bb instrument  (written = concert + 2 semitones)
  Es: 9,  // Eb instrument  (written = concert + 9 semitones)
  F: 7,   // F instrument   (written = concert + 7 semitones)
};

const TRANSPOSE_LABELS: Record<TransposeKey, string> = {
  C: 'Klingend (C)',
  B: 'In B (Klarinette / Trompete)',
  Es: 'In Es (Altsaxophon)',
  F: 'In F (Horn)',
};

// ── Tone Generator ───────────────────────────────────────────────────────────

function useTonePlayer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [activeFreq, setActiveFreq] = useState<number | null>(null);

  const play = useCallback((freq: number) => {
    stop();
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;
    setActiveFreq(freq);
  }, []);

  const stop = useCallback(() => {
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.05);
    }
    setTimeout(() => {
      oscRef.current?.stop();
      ctxRef.current?.close();
      oscRef.current = null;
      ctxRef.current = null;
      gainRef.current = null;
    }, 100);
    setActiveFreq(null);
  }, []);

  const toggle = useCallback((freq: number) => {
    if (activeFreq !== null) { stop(); if (Math.abs(activeFreq - freq) < 0.5) return; }
    play(freq);
  }, [activeFreq, play, stop]);

  return { toggle, stop, activeFreq };
}

// ── Component ───────────────────────────────────────────────────────────────

export function Tuner() {
  const [listening, setListening] = useState(false);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [noteInfo, setNoteInfo] = useState<{ note: string; octave: number; cents: number } | null>(null);
  const [transpose, setTranspose] = useState<TransposeKey>('C');
  const [displayNoteInfo, setDisplayNoteInfo] = useState<{ note: string; octave: number; cents: number } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  // Median filter: keeps last N valid frequencies to smooth out jitter
  const freqHistoryRef = useRef<number[]>([]);

  const tonePlayer = useTonePlayer();

  // Apply transposition to detected concert pitch
  useEffect(() => {
    if (!noteInfo) { setDisplayNoteInfo(null); return; }
    const offset = TRANSPOSE_OFFSETS[transpose];
    if (offset === 0) { setDisplayNoteInfo(noteInfo); return; }
    const { note, octave, cents } = noteInfo;
    const concertIndex = NOTE_NAMES.indexOf(note) + octave * 12;
    const writtenSemitone = concertIndex + offset;
    const writtenIndex = ((writtenSemitone % 12) + 12) % 12;
    const writtenOctave = Math.floor(writtenSemitone / 12);
    setDisplayNoteInfo({ note: NOTE_NAMES[writtenIndex], octave: writtenOctave, cents });
  }, [noteInfo, transpose]);

  const startListening = useCallback(async () => {
    // getUserMedia requires HTTPS or localhost
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Das Stimmgerät benötigt eine sichere Verbindung (HTTPS). Bitte die App über HTTPS aufrufen.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
        video: false,
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      freqHistoryRef.current = [];
      setListening(true);

      const tick = () => {
        if (!analyserRef.current || !bufferRef.current) return;
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const raw = detectPitch(bufferRef.current, ctx.sampleRate);
        if (raw > 0) {
          // Median filter: accumulate last 5 readings, display median to reduce jitter
          const hist = freqHistoryRef.current;
          hist.push(raw);
          if (hist.length > 5) hist.shift();
          const sorted = [...hist].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          setFrequency(median);
          setNoteInfo(frequencyToNote(median));
        } else {
          freqHistoryRef.current = [];
          setFrequency(null);
          setNoteInfo(null);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        alert('Mikrofon-Zugriff wurde verweigert. Bitte die Berechtigung im Browser erteilen.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        alert('Kein Mikrofon gefunden. Bitte ein Mikrofon anschließen.');
      } else {
        alert(`Mikrofon konnte nicht gestartet werden: ${err instanceof Error ? err.message : err}`);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setListening(false);
    setFrequency(null);
    setNoteInfo(null);
  }, []);

  const tonePlayerStop = tonePlayer.stop;
  useEffect(() => {
    return () => {
      stopListening();
      tonePlayerStop();
    };
  }, [stopListening, tonePlayerStop]);

  // Needle angle: ±50 cents → ±90°
  const centsVal = displayNoteInfo?.cents ?? 0;
  const needleAngle = Math.max(-90, Math.min(90, (centsVal / 50) * 90));
  const isInTune = Math.abs(centsVal) <= 5;
  const needleColor = isInTune ? 'var(--color-green-800)' : Math.abs(centsVal) <= 20 ? 'var(--color-green-300)' : 'var(--color-red-500)';

  return (
    <div className="flex flex-col gap-6">

      {/* ── Transposition Selector ── */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TRANSPOSE_LABELS) as TransposeKey[]).map(key => (
          <button
            key={key}
            onClick={() => setTranspose(key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
              transpose === key
                ? 'bg-green-300 text-green-800 border-green-800/30 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
            )}
          >
            {TRANSPOSE_LABELS[key]}
          </button>
        ))}
      </div>

      {/* ── Gauge ── */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-64 h-36 select-none">
          {/* Semicircle arc */}
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* Background arc */}
            <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="var(--color-gray-200)" strokeWidth="12" strokeLinecap="round" />
            {/* In-tune zone (green) */}
            <path d="M 88 14 A 90 90 0 0 1 112 14" fill="none" stroke="var(--color-green-300)" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
            {/* Tick marks */}
            {[-50, -25, 0, 25, 50].map((c) => {
              const ang = ((c / 50) * 90 * Math.PI) / 180;
              const cx = 100 + 90 * Math.sin(ang);
              const cy = 100 - 90 * Math.cos(ang);
              const cx2 = 100 + 76 * Math.sin(ang);
              const cy2 = 100 - 76 * Math.cos(ang);
              return (
                <g key={c}>
                  <line x1={cx} y1={cy} x2={cx2} y2={cy2}
                    stroke={c === 0 ? 'var(--color-green-800)' : 'var(--color-gray-400)'} strokeWidth={c === 0 ? 2 : 1} />
                  <text x={100 + 62 * Math.sin(ang)} y={100 - 62 * Math.cos(ang)}
                    textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="var(--color-gray-400)">
                    {c > 0 ? `+${c}` : c}
                  </text>
                </g>
              );
            })}
            {/* Needle */}
            {displayNoteInfo && (
              <g style={{ transformOrigin: '100px 100px', transform: `rotate(${needleAngle}deg)`, transition: 'transform 0.15s ease-out' }}>
                <line x1="100" y1="100" x2="100" y2="18" stroke={needleColor} strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="100" cy="100" r="5" fill={needleColor} />
              </g>
            )}
            {/* Pivot */}
            <circle cx="100" cy="100" r="4" fill="white" stroke="var(--color-gray-200)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Note Display */}
        <div className="flex flex-col items-center gap-1 min-h-[80px] justify-center">
          {displayNoteInfo ? (
            <>
              <div className={cn('text-7xl font-bold tracking-tight transition-colors', isInTune ? 'text-green-800' : 'text-gray-800')}>
                {displayNoteInfo.note}
                <span className="text-3xl text-gray-400 font-normal ml-1">{displayNoteInfo.octave}</span>
              </div>
              <div className="text-sm text-gray-500">
                {frequency?.toFixed(1)} Hz
                <span className={cn('ml-3 font-medium', isInTune ? 'text-green-800' : Math.abs(centsVal) <= 20 ? 'text-yellow-600' : 'text-red-500')}>
                  {centsVal > 0 ? `+${centsVal}` : centsVal} Cent
                </span>
              </div>
            </>
          ) : (
            <div className="text-gray-300 text-5xl font-bold">–</div>
          )}
        </div>

        {/* Start / Stop */}
        <Button
          onClick={listening ? stopListening : startListening}
          size="lg"
          className={cn(
            'gap-2 px-8 transition-all',
            listening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-800 hover:bg-green-800/90 text-white'
          )}
        >
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          {listening ? 'Mikrofon stoppen' : 'Mikrofon starten'}
        </Button>

        {listening && (
          <p className="text-xs text-gray-400 flex items-center gap-1 animate-pulse">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
            Hört zu…
          </p>
        )}
      </div>

      {/* ── Tone Generator ── */}
      <div className="border-t pt-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Tongeber
          {transpose !== 'C' && (
            <span className="text-xs font-normal text-green-800 bg-green-300/20 px-2 py-0.5 rounded-full">
              In {transpose} – klingend
            </span>
          )}
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Wähle eine Note – die App spielt den entsprechenden Kammerton (Concert Pitch).
          {transpose !== 'C' && ' Töne sind transponiert angezeigt.'}
        </p>
        <ToneKeyboard
          transpose={transpose}
          tonePlayer={tonePlayer}
        />
        {tonePlayer.activeFreq !== null && (
          <button onClick={tonePlayer.stop} className="mt-3 text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
            <VolumeX className="h-3.5 w-3.5" /> Ton stoppen
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tone Keyboard ────────────────────────────────────────────────────────────

interface ToneKeyboardProps {
  transpose: TransposeKey;
  tonePlayer: ReturnType<typeof useTonePlayer>;
}

function ToneKeyboard({ transpose, tonePlayer }: ToneKeyboardProps) {
  const offset = TRANSPOSE_OFFSETS[transpose];
  // We show 2 octaves worth of notes (C4–B5 as written pitch)
  const rows: { writtenNote: string; concertFreq: number }[] = [];

  for (let oct = 4; oct <= 5; oct++) {
    for (let ni = 0; ni < 12; ni++) {
      const writtenSemitone = ni + oct * 12;
      const concertSemitone = writtenSemitone - offset;
      const concertNoteIdx = ((concertSemitone % 12) + 12) % 12;
      const concertOctave = Math.floor(concertSemitone / 12);
      const freq = noteToFrequency(concertNoteIdx, concertOctave);
      rows.push({ writtenNote: `${NOTE_NAMES[ni]}${oct}`, concertFreq: freq });
    }
  }

  const isSharp = (note: string) => note.includes('#');

  // Render as piano keyboard layout (2 octaves)
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map(octIdx => {
        const slice = rows.slice(octIdx * 12, octIdx * 12 + 12);
        return (
          <div key={octIdx} className="relative flex">
            {/* White keys */}
            {slice.filter(r => !isSharp(r.writtenNote)).map((row) => {
              const isActive = tonePlayer.activeFreq !== null && Math.abs(tonePlayer.activeFreq - row.concertFreq) < 0.5;
              return (
                <button
                  key={row.writtenNote}
                  onClick={() => tonePlayer.toggle(row.concertFreq)}
                  title={`${row.writtenNote} (${row.concertFreq.toFixed(1)} Hz)`}
                  className={cn(
                    'relative flex-1 h-16 border border-gray-300 rounded-b-md flex flex-col items-center justify-end pb-1',
                    'text-[9px] font-medium transition-all',
                    isActive
                      ? 'bg-green-300 border-green-800 z-10'
                      : 'bg-white hover:bg-gray-50 active:bg-green-300/30'
                  )}
                >
                  <span className={cn(isActive ? 'text-green-800' : 'text-gray-500')}>
                    {row.writtenNote.replace(/[0-9]/, '')}
                  </span>
                </button>
              );
            })}
            {/* Black keys overlay */}
            <div className="absolute top-0 left-0 w-full flex pointer-events-none">
              {slice.map((row, i) => {
                if (!isSharp(row.writtenNote)) return null;
                const isActive = tonePlayer.activeFreq !== null && Math.abs(tonePlayer.activeFreq - row.concertFreq) < 0.5;
                // Position black keys between white keys
                const prevWhite = slice.filter((r, idx) => idx < i && !isSharp(r.writtenNote)).length;
                const whiteWidth = 100 / 7;
                // Center the black key over the boundary of the previous white key
                const leftPct = prevWhite * whiteWidth - (whiteWidth * 0.4);
                return (
                  <button
                    key={row.writtenNote}
                    onClick={() => tonePlayer.toggle(row.concertFreq)}
                    style={{ left: `${leftPct}%`, width: `${whiteWidth * 0.8}%` }}
                    className={cn(
                      'absolute top-0 h-10 rounded-b-md z-20 pointer-events-auto',
                      'text-[8px] font-medium transition-all',
                      isActive
                        ? 'bg-green-800 border-green-800'
                        : 'bg-gray-800 hover:bg-gray-700'
                    )}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
