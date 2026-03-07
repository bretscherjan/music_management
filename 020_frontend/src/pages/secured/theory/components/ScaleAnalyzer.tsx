import { useState } from 'react';
import { Note } from 'tonal';
import {
  CHROMATIC_NOTES,
  SCALE_MODES,
  getScaleInfo,
  type ScaleMode,
} from '@/hooks/useMusicEngine';
import { cn } from '@/lib/utils';

// ── Staff SVG Component ───────────────────────────────────────────────────────
// We build a lightweight staff renderer for scale display with half-step markers.

const STAFF_LINE_Y = [40, 50, 60, 70, 80]; // E4=80,G4=70,B4=60,D5=50,F5=40
const STEP_PX = 5;        // vertical pixels per staff step
const BASE_Y = 90;        // Y for C4 (one ledger line below E4)
const NOTE_X_START = 70;  // first note x
const NOTE_X_STEP = 48;   // distance between notes

const NOTE_STEPS: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function noteY(tonalNote: string): number {
  const n = Note.get(tonalNote);
  const pc = n.pc ?? 'C';
  const oct = n.oct ?? 4;
  const letter = pc[0];
  const step = NOTE_STEPS[letter] ?? 0;
  const totalStep = (oct - 4) * 7 + step;
  return BASE_Y - totalStep * STEP_PX;
}

const ACC_SYMBOLS: Record<string, string> = { '#': '♯', 'b': '♭', '##': '𝄪', 'bb': '𝄫', 'n': '♮' };

interface StaffProps {
  notes: string[];
  halfStepAfter: number[];
  semitonesAfter: number[];
}

function StaffSVG({ notes, halfStepAfter, semitonesAfter }: StaffProps) {
  const svgWidth = NOTE_X_START + notes.length * NOTE_X_STEP + 20;
  const svgHeight = 130;

  // Generate array of needed ledger lines for a given y
  function getLedgerLines(y: number): number[] {
    const lines: number[] = [];
    for (let l = BASE_Y; l <= y; l += STEP_PX * 2) lines.push(l); // standard below: 90, 100, 110...
    for (let l = 30; l >= y; l -= STEP_PX * 2) lines.push(l); // standard above: 30, 20, 10...
    return lines;
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxHeight: 130 }}>
      {/* Staff lines */}
      {STAFF_LINE_Y.map(y => (
        <line key={y} x1={10} y1={y} x2={svgWidth - 10} y2={y} stroke="#d1d5db" strokeWidth="1" />
      ))}

      {/* Treble clef symbol */}
      <text x={12} y={76} fontSize="52" fontFamily="serif" fill="#6b7280" style={{ userSelect: 'none' }}>𝄞</text>

      {notes.map((note, i) => {
        const x = NOTE_X_START + i * NOTE_X_STEP;
        const y = noteY(note);
        const pc = Note.get(note).pc ?? 'C';
        const acc = pc.slice(1);
        const isHalfStepBefore = i > 0 && halfStepAfter.includes(i - 1);

        return (
          <g key={i}>
            {/* Ledger lines */}
            {getLedgerLines(y).map(ly => (
              <line key={ly} x1={x - 8} y1={ly} x2={x + 8} y2={ly} stroke="#9ca3af" strokeWidth="1.2" />
            ))}

            {/* Accidental */}
            {acc && (
              <text x={x - 10} y={y + 4} textAnchor="middle" fontSize="11" fill="#374151">
                {ACC_SYMBOLS[acc] ?? acc}
              </text>
            )}

            {/* Note head */}
            <ellipse
              cx={x} cy={y}
              rx={6} ry={4.5}
              fill={isHalfStepBefore ? '#405116' : '#1f2937'}
              stroke="none"
            />

            {/* Stem */}
            {i < notes.length - 1 && (() => {
              const stemUp = y > 60; // B4 is 60 (midline). Below midline (> 60), stem goes up.
              const stemX = stemUp ? x + 5.5 : x - 5.5;
              const stemY2 = stemUp ? y - 28 : y + 28;
              return (
                <line x1={stemX} y1={y} x2={stemX} y2={stemY2} stroke={isHalfStepBefore ? '#405116' : '#4b5563'} strokeWidth="1.2" />
              );
            })()}

            {/* Interval bracket between this note and the next */}
            {(semitonesAfter[i] === 1 || semitonesAfter[i] === 3) && i < notes.length - 1 && (
              <g>
                <path
                  d={`M ${x + 12} ${y + 16} Q ${x + NOTE_X_STEP / 2} ${y + 24} ${x + NOTE_X_STEP - 12} ${noteY(notes[i + 1]) + 16}`}
                  fill="none"
                  stroke={semitonesAfter[i] === 1 ? '#ef4444' : '#a855f7'}
                  strokeWidth="1.5"
                  strokeDasharray="3,2"
                />
                <text
                  x={x + NOTE_X_STEP / 2}
                  y={Math.max(noteY(notes[i]), noteY(notes[i + 1])) + 30}
                  textAnchor="middle"
                  fontSize="7"
                  fill={semitonesAfter[i] === 1 ? '#ef4444' : '#a855f7'}
                  fontWeight="600"
                >
                  {semitonesAfter[i] === 1 ? '½' : '1½'}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ScaleAnalyzer() {
  const [root, setRoot] = useState('C');
  const [mode, setMode] = useState<ScaleMode>('major');

  const scaleInfo = getScaleInfo(root, mode);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
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
                    ? 'bg-[#BDD18C] text-[#405116] border-[#405116]/30 font-bold'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#BDD18C]'
                )}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">Modus</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SCALE_MODES) as ScaleMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all',
                  mode === m
                    ? 'bg-[#BDD18C] text-[#405116] border-[#405116]/30'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#BDD18C]'
                )}
              >
                {SCALE_MODES[m].split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scale title */}
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-bold text-gray-800">
          {scaleInfo.noteNames[0]}-{SCALE_MODES[scaleInfo.mode].split(' ')[0]}
        </h3>
        {scaleInfo.keySignature && scaleInfo.keySignature !== '—' && (
          <span className="text-sm text-gray-500">
            ({scaleInfo.keySignature.includes('#')
              ? `${scaleInfo.keySignature.length} ♯`
              : `${scaleInfo.keySignature.length} ♭`})
          </span>
        )}
        {scaleInfo.relativeKey && (
          <span className="text-xs text-[#405116] bg-[#BDD18C]/20 px-2 py-0.5 rounded-full">
            Relative: {scaleInfo.relativeKey}
          </span>
        )}
      </div>

      {/* Staff Notation */}
      <div className="bg-white rounded-xl border border-gray-100 px-2 py-1 overflow-x-auto">
        <StaffSVG notes={scaleInfo.notes} halfStepAfter={scaleInfo.halfStepAfter} semitonesAfter={scaleInfo.semitonesAfter} />
      </div>

      {/* Note Name Strip */}
      <div className="flex items-center gap-1 flex-wrap">
        {scaleInfo.noteNames.map((name, i) => {
          const isHalfBefore = i > 0 && scaleInfo.halfStepAfter.includes(i - 1);
          const stepSemis = i > 0 ? scaleInfo.semitonesAfter[i - 1] : 0;
          return (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && (
                <div className={cn(
                  'text-[10px] font-bold px-1',
                  stepSemis === 1 ? 'text-red-500' : stepSemis === 3 ? 'text-purple-500' : 'text-gray-300'
                )}>
                  {stepSemis === 1 ? '½' : stepSemis === 3 ? '1½' : '1'}
                </div>
              )}
              <div className={cn(
                'flex flex-col items-center min-w-[28px] h-8 rounded-lg border text-xs font-bold justify-center transition-colors',
                isHalfBefore
                  ? 'bg-[#405116] text-white border-[#405116]'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              )}>
                {name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Half-step explanation */}
      <p className="text-[11px] text-gray-400 border-t pt-2 mt-1">
        <span className="text-red-500 font-medium">Rote Bögen & ½</span> = Halbtonschritte.<br />
        <span className="text-purple-500 font-medium">Violette Bögen & 1½</span> = Anderthalbtonschritte.<br />
        <span className="text-[#BDD18C] font-medium">Natürliche Halbtöne:</span> <strong>E–F</strong> und <strong>H–C</strong>.
      </p>
    </div>
  );
}
