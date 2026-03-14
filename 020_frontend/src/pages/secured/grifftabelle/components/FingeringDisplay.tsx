import { useState } from 'react';
import { ChevronDown, ChevronUp, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { labelKey } from '../constants/keyLabels';
import type { GrifftabelleFingering } from '@/types/grifftabelle';

interface FingeringDisplayProps {
  fingering: GrifftabelleFingering | null;
  note: string | null;
}

function KeyBadge({ keyCode }: { keyCode: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-300/30 text-green-800 text-xs font-medium border border-green-300/50">
      {labelKey(keyCode)}
    </span>
  );
}

function FingeringList({ keys }: { keys: string[] }) {
  if (keys.length === 0) {
    return <p className="text-sm text-gray-400 italic">Alle Löcher offen</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k, i) => (
        <KeyBadge key={i} keyCode={k} />
      ))}
    </div>
  );
}

export function FingeringDisplay({ fingering, note }: FingeringDisplayProps) {
  const [showAlts, setShowAlts] = useState(false);
  const [showTrils, setShowTrils] = useState(false);

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
        <Music className="h-8 w-8 opacity-30" />
        <span>Wähle einen Ton aus</span>
      </div>
    );
  }

  if (!fingering) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
        <Music className="h-8 w-8 opacity-30" />
        <span>Kein Griff für {note} gefunden</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Standard fingering */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Standardgriff
        </p>
        <FingeringList keys={fingering.standard} />
      </div>

      {/* Alternatives */}
      {fingering.alternatives.length > 0 && (
        <div>
          <button
            onClick={() => setShowAlts(v => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 hover:text-green-800 transition-colors"
          >
            {showAlts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Alternativen ({fingering.alternatives.length})
          </button>
          {showAlts && (
            <div className="space-y-3">
              {fingering.alternatives.map((alt, i) => (
                <div key={i} className="pl-3 border-l-2 border-green-300">
                  {alt.description && (
                    <p className="text-xs text-gray-500 mb-1">{alt.description}</p>
                  )}
                  <FingeringList keys={alt.fingering} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trills */}
      {fingering.trills.length > 0 && (
        <div>
          <button
            onClick={() => setShowTrils(v => !v)}
            className={cn(
              'flex items-center gap-1 text-xs font-semibold uppercase tracking-wide mb-1.5 transition-colors',
              showTrils ? 'text-green-800' : 'text-gray-500 hover:text-green-800'
            )}
          >
            {showTrils ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Triller ({fingering.trills.length})
          </button>
          {showTrils && (
            <div className="space-y-3">
              {fingering.trills.map((trill, i) => (
                <div key={i} className="pl-3 border-l-2 border-amber-400">
                  <p className="text-xs text-gray-500 mb-1">
                    Triller → <span className="font-semibold text-gray-700">{trill.to}</span>
                  </p>
                  <FingeringList keys={trill.fingering} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
