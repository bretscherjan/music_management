import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KEY_LABELS } from '@/pages/secured/grifftabelle/constants/keyLabels';
import type { GrifftabelleFingering, GrifftabelleAlternative, GrifftabelleTrill } from '@/types/grifftabelle';

interface FingeringEditorPanelProps {
  instrumentId: string;
  note: string | null;
  fingering: GrifftabelleFingering | null;
  availableKeys: string[];
  onUpdateFingering: (updated: GrifftabelleFingering) => void;
}

function KeyBadge({ keyCode, active, onToggle }: { keyCode: string; active: boolean; onToggle: () => void }) {
  const label = KEY_LABELS[keyCode] ?? keyCode;
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-[#e60004] text-white border-[#e60004] hover:bg-[#c00003]'
          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
      }`}
      title={keyCode}
    >
      {label}
    </button>
  );
}

export function FingeringEditorPanel({
  note,
  fingering,
  availableKeys,
  onUpdateFingering,
}: FingeringEditorPanelProps) {
  if (!note || !fingering) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border rounded-xl bg-gray-50">
        Keine Note ausgewählt
      </div>
    );
  }

  // Union of availableKeys + all keys actually used in this fingering
  const usedKeys = [
    ...fingering.standard,
    ...fingering.alternatives.flatMap(a => a.fingering),
    ...fingering.trills.flatMap(t => t.fingering),
  ];
  const allKeys = [...new Set([...availableKeys, ...usedKeys])].sort();

  function toggleStandard(key: string) {
    const current = fingering!.standard;
    const updated = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
    onUpdateFingering({ ...fingering!, standard: updated });
  }

  function toggleAltKey(altIdx: number, key: string) {
    const alts = fingering!.alternatives.map((a, i) => {
      if (i !== altIdx) return a;
      const f = a.fingering.includes(key) ? a.fingering.filter(k => k !== key) : [...a.fingering, key];
      return { ...a, fingering: f };
    });
    onUpdateFingering({ ...fingering!, alternatives: alts });
  }

  function updateAltDesc(altIdx: number, desc: string) {
    const alts = fingering!.alternatives.map((a, i) => i !== altIdx ? a : { ...a, description: desc });
    onUpdateFingering({ ...fingering!, alternatives: alts });
  }

  function removeAlt(altIdx: number) {
    const alts = fingering!.alternatives.filter((_, i) => i !== altIdx);
    onUpdateFingering({ ...fingering!, alternatives: alts });
  }

  function addAlt() {
    const newAlt: GrifftabelleAlternative = { description: '', fingering: [] };
    onUpdateFingering({ ...fingering!, alternatives: [...fingering!.alternatives, newAlt] });
  }

  function toggleTrillKey(trillIdx: number, key: string) {
    const trills = fingering!.trills.map((t, i) => {
      if (i !== trillIdx) return t;
      const f = t.fingering.includes(key) ? t.fingering.filter(k => k !== key) : [...t.fingering, key];
      return { ...t, fingering: f };
    });
    onUpdateFingering({ ...fingering!, trills });
  }

  function updateTrillTo(trillIdx: number, to: string) {
    const trills = fingering!.trills.map((t, i) => i !== trillIdx ? t : { ...t, to });
    onUpdateFingering({ ...fingering!, trills });
  }

  function removeTrill(trillIdx: number) {
    const trills = fingering!.trills.filter((_, i) => i !== trillIdx);
    onUpdateFingering({ ...fingering!, trills });
  }

  function addTrill() {
    const newTrill: GrifftabelleTrill = { to: '', fingering: [] };
    onUpdateFingering({ ...fingering!, trills: [...fingering!.trills, newTrill] });
  }

  return (
    <div className="space-y-4">
      {/* Standard */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Standard-Griff</Label>
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
          {fingering.standard.length === 0 && (
            <span className="text-xs text-muted-foreground italic">Keine Tasten</span>
          )}
          {fingering.standard.map(key => (
            <KeyBadge key={key} keyCode={key} active={true} onToggle={() => toggleStandard(key)} />
          ))}
        </div>
        <div className="text-xs text-muted-foreground mb-1">Verfügbare Tasten (klicken zum Hinzufügen/Entfernen):</div>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
          {allKeys.map(key => (
            <KeyBadge
              key={key}
              keyCode={key}
              active={fingering.standard.includes(key)}
              onToggle={() => toggleStandard(key)}
            />
          ))}
        </div>
      </div>

      {/* Alternatives */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Alternativgriffe</Label>
        <div className="space-y-3">
          {fingering.alternatives.map((alt, i) => (
            <div key={i} className="border rounded-lg p-3 bg-gray-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Alternativ {i + 1}</span>
                <Input
                  value={alt.description}
                  onChange={e => updateAltDesc(i, e.target.value)}
                  placeholder="Beschreibung…"
                  className="h-7 text-xs flex-1"
                />
                <Button variant="ghost" size="sm" onClick={() => removeAlt(i)} className="h-7 w-7 p-0 text-red-500">
                  ✕
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {alt.fingering.length === 0 && <span className="text-xs text-muted-foreground italic">Keine Tasten</span>}
                {alt.fingering.map(key => (
                  <KeyBadge key={key} keyCode={key} active={true} onToggle={() => toggleAltKey(i, key)} />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border rounded p-1.5 bg-white">
                {allKeys.map(key => (
                  <KeyBadge key={key} keyCode={key} active={alt.fingering.includes(key)} onToggle={() => toggleAltKey(i, key)} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addAlt} className="mt-2 text-xs">
          ➕ Alternativgriff hinzufügen
        </Button>
      </div>

      {/* Trills */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Triller</Label>
        <div className="space-y-3">
          {fingering.trills.map((trill, i) => (
            <div key={i} className="border rounded-lg p-3 bg-gray-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Triller zu:</span>
                <Input
                  value={trill.to}
                  onChange={e => updateTrillTo(i, e.target.value)}
                  placeholder="z.B. D4"
                  className="h-7 text-xs w-24"
                />
                <Button variant="ghost" size="sm" onClick={() => removeTrill(i)} className="h-7 w-7 p-0 text-red-500">
                  ✕
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {trill.fingering.length === 0 && <span className="text-xs text-muted-foreground italic">Keine Tasten</span>}
                {trill.fingering.map(key => (
                  <KeyBadge key={key} keyCode={key} active={true} onToggle={() => toggleTrillKey(i, key)} />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border rounded p-1.5 bg-white">
                {allKeys.map(key => (
                  <KeyBadge key={key} keyCode={key} active={trill.fingering.includes(key)} onToggle={() => toggleTrillKey(i, key)} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addTrill} className="mt-2 text-xs">
          ➕ Triller hinzufügen
        </Button>
      </div>
    </div>
  );
}
