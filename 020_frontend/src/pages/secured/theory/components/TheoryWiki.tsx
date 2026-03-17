const CIRCLE_ROWS = [
  { key: 'C', sharps: 0, minorKey: 'a', accidentals: '—' },
  { key: 'G', sharps: 1, minorKey: 'e', accidentals: 'Fis' },
  { key: 'D', sharps: 2, minorKey: 'h', accidentals: 'Fis · Cis' },
  { key: 'A', sharps: 3, minorKey: 'fis', accidentals: 'Fis · Cis · Gis' },
  { key: 'E', sharps: 4, minorKey: 'cis', accidentals: 'Fis · Cis · Gis · Dis' },
  { key: 'H', sharps: 5, minorKey: 'gis', accidentals: 'Fis · Cis · Gis · Dis · Ais' },
  { key: 'Fis/Ges', sharps: 6, minorKey: 'dis/es', accidentals: '6 ♯ / 6 ♭' },
  { key: 'Des', sharps: -5, minorKey: 'b', accidentals: 'B · Es · As · Des · Ges' },
  { key: 'As', sharps: -4, minorKey: 'f', accidentals: 'B · Es · As · Des' },
  { key: 'Es', sharps: -3, minorKey: 'c', accidentals: 'B · Es · As' },
  { key: 'B', sharps: -2, minorKey: 'g', accidentals: 'B · Es' },
  { key: 'F', sharps: -1, minorKey: 'd', accidentals: 'B' },
];

const CHORD_FORMULAS = [
  { name: 'Dur', symbol: '', formula: '1 · 3 · 5', semitones: '0 – 4 – 7 HT', example: 'C – E – G' },
  { name: 'Moll', symbol: 'm', formula: '1 · ♭3 · 5', semitones: '0 – 3 – 7 HT', example: 'A – C – E' },
  { name: 'Vermindert', symbol: 'dim', formula: '1 · ♭3 · ♭5', semitones: '0 – 3 – 6 HT', example: 'H – D – F' },
  { name: 'Übermässig', symbol: 'aug', formula: '1 · 3 · ♯5', semitones: '0 – 4 – 8 HT', example: 'C – E – Gis' },
  { name: 'Dominant-Sept', symbol: '7', formula: '1 · 3 · 5 · ♭7', semitones: '0 – 4 – 7 – 10 HT', example: 'G – H – D – F' },
];

const TRANSPOSITION_TABLE = [
  { instrument: 'Bb', written: 'C', concert: 'B', offset: '−2 HT (Grosse Sekunde abwärts)' },
  { instrument: 'Es', written: 'C', concert: 'Es', offset: '+9 HT (Kleine Sexte aufwärts, oder Grosse Terz abwärts)' },
  { instrument: 'F', written: 'C', concert: 'F', offset: '−7 HT (Reine Quinte abwärts)' },
];

export function TheoryWiki() {
  return (
    <div className="flex flex-col gap-8">

      {/* ── Transposition ── */}
      <section>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-3">
          Transpositions-Referenz
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs">Instrument</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs">Geschrieben</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs">Klingt als</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs">Verschiebung</th>
              </tr>
            </thead>
            <tbody>
              {TRANSPOSITION_TABLE.map((row, i) => (
                <tr key={i} className="border-b border-border/50 transition-colors hover:bg-muted/50 even:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium text-primary">{row.instrument}</td>
                  <td className="px-4 py-2.5 font-bold">{row.written}</td>
                  <td className="px-4 py-2.5 font-bold">{row.concert}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{row.offset}</td>
                </tr>
              ))}
              <tr className="border-t border-border/50 bg-primary/20">
                <td className="px-4 py-2.5 font-medium text-foreground">C</td>
                <td className="px-4 py-2.5 font-bold">C</td>
                <td className="px-4 py-2.5 font-bold">C</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">Keine Transposition</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Natürliche Halbtöne im Tonalsystem: <strong>E–F</strong> und <strong>H–C</strong>.
          Stimmton: <strong>A1 = 440 Hz</strong> (international), <strong>442 Hz</strong> (orchestral).
        </p>
      </section>

      {/* ── Quintenzirkel Tabelle ── */}
      <section>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-3">
          Quintenzirkel – alle Dur-Tonarten
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-3 py-2.5 font-semibold text-muted-foreground text-xs">Tonart</th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground text-xs">Vorzeichen</th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground text-xs">Vorzeichen-Töne</th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground text-xs">Parallele Moll</th>
              </tr>
            </thead>
            <tbody>
              {CIRCLE_ROWS.map((row, i) => (
                <tr key={i} className="border-b border-border/50 transition-colors hover:bg-muted/50 even:bg-muted/20">
                  <td className="px-3 py-2 font-bold text-primary">{row.key}-Dur</td>
                  <td className="px-3 py-2 font-mono text-center">
                    {row.sharps === 0 ? '—' : row.sharps > 0
                      ? `${row.sharps} ♯`
                      : `${-row.sharps} ♭`}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{row.accidentals}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.minorKey}-Moll</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Akkord-Formeln ── */}
      <section>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-3">
          Akkord-Formeln
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs">Typ</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs">Stufen</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs">Halbtöne</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs">Beispiel</th>
              </tr>
            </thead>
            <tbody>
              {CHORD_FORMULAS.map((row, i) => (
                <tr key={i} className="border-b border-border/50 transition-colors hover:bg-muted/50 even:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">
                    {row.name}
                    <span className="ml-1.5 text-xs font-mono text-muted-foreground">{row.symbol}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{row.formula}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.semitones}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
