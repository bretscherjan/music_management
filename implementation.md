
Hier ist dein **Implementation Plan**, um das Projekt in React/Vite/TS mit `tonal` und `vexflow` umzusetzen:

---

### Schritt 1: Das Daten-Modell & Provider (State)

Da die App instrumentenübergreifend funktionieren soll, benötigst du einen zentralen State, der weiß, welches Instrument gerade aktiv ist und welcher Ton ausgewählt wurde.

1. **Context API oder Zustand:** Erstelle einen Store für `selectedInstrumentId` und `selectedNote` (z.B. "C4").
2. **Data-Hook:** Schreibe einen Custom-Hook `useFingering`, der:
* Das entsprechende Instrument aus der `grifftabellen.json` filtert.
* Den aktuell gewählten Ton im `fingerings`-Array sucht.
* Die `standard`-Griffe und `alternatives` zurückgibt.



### Schritt 2: Musiktheorie mit `tonal` (Die Tonleiter)

Du möchtest dem User alle chromatischen Töne innerhalb der Spannweite des Instruments anbieten.

1. **Range-Generierung:**
```typescript
import { Range, Note } from "tonal";

// Beispiel für Altsaxophon (Range: Db3 bis A6)
const min = instrument.metadata.range.min;
const max = instrument.metadata.range.max;
const allNotes = Range.chromatic([min, max]); // Erstellt Array ["Db3", "D3", "Eb3", ...]

```


2. **Display-Logik:** Entscheide, ob du die Töne in einer Liste, einem Slider oder direkt als klickbare Noten in VexFlow anzeigst.

### Schritt 3: Übersetzung & Mapping (JSON -> Text)

Hier verknüpfst du die Codes (z.B. `lh1`) mit den lesbaren Beschreibungen aus deiner `DOCUMENTATION.md`.

1. **Dictionary erstellen:** Erstelle ein Mapping-Objekt (am besten auch als JSON oder TS-Const), das die technischen Keys in "Klartext" übersetzt.
```typescript
const KEY_LABELS: Record<string, string> = {
  lh1: "Linker Zeigefinger",
  lh2: "Linker Mittelfinger",
  rh_pinky_eb: "Rechter kleiner Finger (Es-Klappe)",
  v1: "1. Ventil",
  pos1: "1. Position (ganz eingefahren)"
  // ... alle Keys aus der Doku
};

```


2. **Formatter-Funktion:** Eine Funktion nimmt das Array `["lh1", "lh2"]` und gibt einen lesbaren String oder eine Liste zurück: *"Linker Zeigefinger, Linker Mittelfinger"*.

### Schritt 4: Die Noten-Komponente (VexFlow)

VexFlow ist mächtig, aber etwas sperrig in React.

1. **VexFlow-Container:** Erstelle eine Komponente, die ein `canvas`- oder `svg`-Element rendert.
2. **Dynamic Rendering:** Wenn sich `selectedNote` im State ändert, muss VexFlow die Note neu zeichnen.
3. **Klick-Interaktion:** Du kannst über die Noten ein unsichtbares Overlay legen oder (einfacher) eine Tastatur/Liste unter der Notenzeile nutzen, um den Ton zu wählen.

### Schritt 5: Triller-Logik implementieren

Wenn der User auf "Triller" klickt:

1. Suche im JSON das `trills`-Objekt für die aktuelle Note.
2. Gib aus: "Halte [Standardgriff] und trillere mit [Action-Key]".
3. Nutze das Mapping aus Schritt 3, um den `action`-Key (z.B. `trill_rh_side_c`) zu übersetzen.

---

### Zusammenfassung der Architektur (Frontend)

* **`InstrumentSelector.tsx`**: Dropdown für Saxophon, Trompete, etc.
* **`NoteStaff.tsx`**: Die VexFlow-Notenzeile.
* **`FingeringDisplay.tsx`**: Hier passiert die Magie.
* Input: `["lh1", "lh2"]`
* Logik: `fingering.map(key => KEY_LABELS[key])`
* Output: Eine Liste von Anweisungen ("Drücke: ...").


* **`TheoryService.ts`**: Enthält die `tonal`-Logik für Transposition und Ambitus.

### Nächster konkreter Schritt für dich:

Erstelle in deinem Projekt das `KEY_LABELS`-Objekt basierend auf deiner Dokumentation. Das ist die Brücke, damit aus dem "Code" im JSON echte Sprache wird.

**Soll ich dir zeigen, wie man die VexFlow-Komponente so in React einbindet, dass sie auf Ton-Änderungen reagiert?**