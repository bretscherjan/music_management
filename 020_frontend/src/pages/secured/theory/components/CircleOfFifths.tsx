import { useState } from 'react';
import { CIRCLE_DATA, toGerman, type CircleEntry } from '@/hooks/useMusicEngine';

// ── Geometry helpers ──────────────────────────────────────────────────────────

const CX = 140, CY = 140;
const R_OUTER = 120, R_MID = 80, R_INNER = 50, R_CENTER = 35;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function sectorPath(r1: number, r2: number, startDeg: number, endDeg: number) {
  const a1 = toRad(startDeg), a2 = toRad(endDeg);
  const x1 = CX + r2 * Math.cos(a1), y1 = CY + r2 * Math.sin(a1);
  const x2 = CX + r2 * Math.cos(a2), y2 = CY + r2 * Math.sin(a2);
  const x3 = CX + r1 * Math.cos(a2), y3 = CY + r1 * Math.sin(a2);
  const x4 = CX + r1 * Math.cos(a1), y4 = CY + r1 * Math.sin(a1);
  return `M ${x1} ${y1} A ${r2} ${r2} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 0 0 ${x4} ${y4} Z`;
}

function labelPos(r: number, midDeg: number) {
  return {
    x: CX + r * Math.cos(toRad(midDeg)),
    y: CY + r * Math.sin(toRad(midDeg)),
  };
}

// Sectors start at -90° (top = C), each spans 30°
function entryAngles(index: number) {
  const start = index * 30 - 90 - 15; // -15 to centre the label
  return { start, mid: start + 15, end: start + 30 };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  selectedKey?: string;
  onSelect?: (entry: CircleEntry) => void;
}

export function CircleOfFifths({ selectedKey, onSelect }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const mode = 'major';

  return (
    <div className="flex flex-col items-center gap-3">

      {/* SVG Circle */}
      <svg viewBox="0 0 280 280" className="w-full max-w-[320px]" role="img" aria-label="Quintenzirkel">
        <defs>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
          </filter>
        </defs>

        {CIRCLE_DATA.map((entry) => {
          const { start, mid, end } = entryAngles(entry.index);
          let isSelected = mode === 'major'
            ? selectedKey === entry.major
            : selectedKey === entry.minor;
          const isHovered = hovered === entry.index;

          // Colour logic
          const outerFill = isSelected
            ? 'var(--color-green-800)'
            : isHovered ? 'var(--color-green-300)' : '#f3f4f6';
          const innerFill = isSelected
            ? 'var(--color-green-300)'
            : isHovered ? '#e9f0da' : '#fafafa';
          const outerText = isSelected ? '#fff' : isHovered ? 'var(--color-green-800)' : '#374151';
          const innerText = isSelected ? 'var(--color-green-800)' : '#6b7280';

          const outerLabel = labelPos(R_OUTER - 18, mid);
          const innerLabel = labelPos(R_MID - 18, mid);
          const sigLabel = labelPos(R_INNER - 12, mid);

          return (
            <g
              key={entry.index}
              className="cursor-pointer"
              onClick={() => onSelect?.(entry)}
              onMouseEnter={() => setHovered(entry.index)}
              onMouseLeave={() => setHovered(null)}
              style={{ transition: 'all 0.15s ease' }}
            >
              {/* Outer ring: Major keys */}
              <path
                d={sectorPath(R_MID, R_OUTER, start, end)}
                fill={outerFill}
                stroke="white"
                strokeWidth="2"
                style={{ transition: 'fill 0.15s' }}
              />
              <text
                x={outerLabel.x} y={outerLabel.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontWeight={isSelected || mode === 'major' ? '700' : '500'}
                fill={outerText}
                style={{ pointerEvents: 'none' }}
              >
                {entry.majorDE}
              </text>

              {/* Inner ring: Relative minor keys */}
              <path
                d={sectorPath(R_INNER, R_MID, start, end)}
                fill={innerFill}
                stroke="white"
                strokeWidth="2"
                style={{ transition: 'fill 0.15s' }}
              />
              <text
                x={innerLabel.x} y={innerLabel.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight={isSelected ? '700' : '400'}
                fill={innerText}
                style={{ pointerEvents: 'none' }}
              >
                {entry.minorDE}m
              </text>

              {/* Signature hint (very small, in the segment) */}
              <text
                x={sigLabel.x} y={sigLabel.y + 0}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="7" fill="var(--color-gray-400)"
                style={{ pointerEvents: 'none' }}
              >
                {entry.signature}
              </text>
            </g>
          );
        })}

        {/* Centre circle */}
        <circle cx={CX} cy={CY} r={R_CENTER} fill="white" stroke="var(--color-gray-200)" strokeWidth="1.5" />
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-green-800)">
          {selectedKey
            ? toGerman(mode === 'major'
              ? (CIRCLE_DATA.find(e => e.major === selectedKey || e.minor === selectedKey)?.major ?? selectedKey)
              : (CIRCLE_DATA.find(e => e.major === selectedKey || e.minor === selectedKey)?.minor?.toUpperCase() ?? selectedKey))
            : '5°'}
        </text>
        <text x={CX} y={CY + 7} textAnchor="middle" fontSize="8" fill="var(--color-gray-400)">
          {selectedKey ? (mode === 'major' ? 'Dur' : 'Moll') : 'Klick!'}
        </text>
      </svg>

      {/* Legend */}
      {selectedKey && (() => {
        const entry = CIRCLE_DATA.find(e => e.major === selectedKey || e.minor === selectedKey);
        if (!entry) return null;
        const sigs = entry.sharps;
        return (
          <div className="text-xs text-center text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
            <strong className="text-green-800">{entry.majorDE}-Dur</strong> · Relative Moll:{' '}
            <strong className="text-green-800">{entry.minorDE}-Moll</strong>
            {' · '}
            {sigs === 0 ? 'keine Vorzeichen' : sigs > 0 ? `${sigs} Kreuz${sigs > 1 ? 'e' : ''}` : `${-sigs} B${-sigs > 1 ? 's' : ''}`}
          </div>
        );
      })()}
    </div>
  );
}
