import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstrumentSelector } from '@/pages/secured/grifftabelle/components/InstrumentSelector';
import { NoteSelector } from '@/pages/secured/grifftabelle/components/NoteSelector';
import type { GrifftabelleInstrument, GrifftabelleFingering } from '@/types/grifftabelle';
import { InstrumentSvgEditor } from './grifftabelleEditor/InstrumentSvgEditor';
import { FingeringEditorPanel } from './grifftabelleEditor/FingeringEditorPanel';
import { instrumentSvgMap, svgAvailableKeys } from './grifftabelleEditor/svgKeyMaps';
import { KEY_LABELS } from '@/pages/secured/grifftabelle/constants/keyLabels';
import originalData from '@/data/grifftabellen.json';

const STORAGE_KEY = 'grifftabellen_editor_data';

function countChanges(current: GrifftabelleInstrument[], original: GrifftabelleInstrument[]): number {
  let count = 0;
  for (const inst of current) {
    const orig = original.find(o => o.instrumentId === inst.instrumentId);
    if (!orig) { count += inst.fingerings.length; continue; }
    for (const f of inst.fingerings) {
      const of_ = orig.fingerings.find(o => o.note === f.note);
      if (!of_ || JSON.stringify(f) !== JSON.stringify(of_)) count++;
    }
  }
  return count;
}

export function GrifftabelleEditorPage() {
  const [data, setData] = useState<GrifftabelleInstrument[]>(originalData as GrifftabelleInstrument[]);
  const [instrumentId, setInstrumentId] = useState('flute');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savedDataOffer, setSavedDataOffer] = useState<{ data: GrifftabelleInstrument[]; date: string } | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const meta = localStorage.getItem(STORAGE_KEY + '_date');
        setSavedDataOffer({ data: parsed, date: meta ?? 'Unbekanntes Datum' });
      } catch {
        // ignore
      }
    }
  }, []);

  const currentInstrument = data.find(i => i.instrumentId === instrumentId);
  const availableNotes = currentInstrument?.fingerings.map(f => f.note) ?? [];
  const currentFingering = selectedNote
    ? currentInstrument?.fingerings.find(f => f.note === selectedNote) ?? null
    : null;

  const svgFile = instrumentSvgMap[instrumentId] ?? null;
  const svgKeys = svgFile ? (svgAvailableKeys[svgFile] ?? []) : Object.keys(KEY_LABELS);

  // For SVG editor, active keys = standard fingering of selected note
  const activeKeys = currentFingering?.standard ?? [];

  const onToggleKey = useCallback((key: string) => {
    if (!selectedNote || !currentFingering) return;
    const current = currentFingering.standard;
    const updated = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
    updateFingering(instrumentId, selectedNote, { ...currentFingering, standard: updated });
  }, [selectedNote, currentFingering, instrumentId]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateFingering(instId: string, note: string, updated: GrifftabelleFingering) {
    setData(prev => prev.map(inst =>
      inst.instrumentId !== instId ? inst : {
        ...inst,
        fingerings: inst.fingerings.map(f => f.note === note ? updated : f),
      }
    ));
    setIsDirty(true);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY + '_date', new Date().toLocaleString('de-CH'));
    setIsDirty(false);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grifftabellen.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDiscard() {
    setData(originalData as GrifftabelleInstrument[]);
    setIsDirty(false);
  }

  function handleLoadSaved() {
    if (savedDataOffer) {
      setData(savedDataOffer.data);
      setIsDirty(true);
      setSavedDataOffer(null);
    }
  }

  const changeCount = countChanges(data, originalData as GrifftabelleInstrument[]);

  // Determine clef for NoteSelector
  const clef = ['tuba_eb', 'tuba_bb', 'trombone', 'euphonium', 'baritone_horn', 'tenor_horn', 'bassoon'].includes(instrumentId)
    ? 'bass'
    : 'treble';

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="h-1 bg-[#e60004] rounded-t-2xl" />
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Grifftabellen Editor</h1>
            <Badge variant="destructive" className="text-xs">Admin only</Badge>
          </div>
          {isDirty && (
            <Badge variant="outline" className="text-orange-600 border-orange-400">
              {changeCount} Änderung{changeCount !== 1 ? 'en' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Saved data offer */}
      {savedDataOffer && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-center justify-between">
          <span className="text-sm text-blue-800">
            Gespeicherte Änderungen gefunden ({savedDataOffer.date}). Laden?
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleLoadSaved}>Laden</Button>
            <Button size="sm" variant="ghost" onClick={() => setSavedDataOffer(null)}>Ignorieren</Button>
          </div>
        </div>
      )}

      {/* Selectors */}
      <div className="rounded-2xl border bg-white shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Instrument</label>
          <InstrumentSelector value={instrumentId} onChange={id => { setInstrumentId(id); setSelectedNote(null); }} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Note</label>
          <NoteSelector
            notes={availableNotes}
            selected={selectedNote}
            onChange={setSelectedNote}
            clef={clef}
          />
        </div>
      </div>

      {/* Main editor area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SVG Editor */}
        <div className="rounded-2xl border bg-white shadow-sm p-4">
          <h2 className="text-sm font-semibold mb-3 text-gray-700">
            SVG Griffbild{selectedNote ? ` — ${selectedNote}` : ''}
            <span className="text-xs font-normal text-muted-foreground ml-2">(Standard-Griff)</span>
          </h2>
          <InstrumentSvgEditor
            svgFile={svgFile}
            activeKeys={activeKeys}
            onToggleKey={onToggleKey}
          />
        </div>

        {/* Fingering editor */}
        <div className="rounded-2xl border bg-white shadow-sm p-4 overflow-y-auto max-h-[700px]">
          <h2 className="text-sm font-semibold mb-3 text-gray-700">
            Griff bearbeiten{selectedNote ? ` — ${selectedNote}` : ''}
          </h2>
          <FingeringEditorPanel
            instrumentId={instrumentId}
            note={selectedNote}
            fingering={currentFingering}
            availableKeys={svgKeys}
            onUpdateFingering={updated => {
              if (selectedNote) updateFingering(instrumentId, selectedNote, updated);
            }}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-wrap gap-2 items-center">
        <Button onClick={handleSave} disabled={!isDirty} className="bg-[#e60004] hover:bg-[#c00003] text-white">
          Alle Änderungen speichern
        </Button>
        <Button onClick={handleExport} variant="outline">
          JSON exportieren
        </Button>
        <Button onClick={handleDiscard} variant="ghost" disabled={!isDirty} className="text-red-600">
          Änderungen verwerfen
        </Button>
        {!isDirty && (
          <span className="text-xs text-muted-foreground ml-auto">Keine ungespeicherten Änderungen</span>
        )}
      </div>
    </div>
  );
}
