# Dokumentation der Grifftabellen

## Allgemeine Bezeichnungen (für alle Instrumente)

| Kategorie | Code | Beschreibung |
|-----------|------|--------------|
| **Haupthand links** | `lh1` | Linker Zeigefinger |
| | `lh2` | Linker Mittelfinger |
| | `lh3` | Linker Ringfinger |
| **Haupthand rechts** | `rh1` | Rechter Zeigefinger |
| | `rh2` | Rechter Mittelfinger |
| | `rh3` | Rechter Ringfinger |
| **Daumen** | `lh_thumb` | Linker Daumen (allgemein) |
| | `lh_octave` | Oktavklappe (Oboe, Saxophon) |
| | `lh_whisper` | Whisper-/Flick-Klappe (Fagott) |
| **Kleinfinger links** | `lh_pinky_gs` | G#-Klappe (linker kleiner Finger) |
| | `lh_pinky_low_b` | Tiefe B/H-Klappe (Sax, Flöte) |
| | `lh_pinky_low_bb` | Tiefe Bb-Klappe (Sax, Oboe) |
| **Kleinfinger rechts** | `rh_pinky_eb` | Es-Klappe (rechter kleiner Finger) |
| | `rh_pinky_low_c` | Tiefe C-Klappe |
| | `rh_pinky_low_cs` | Tiefe C#-Klappe (Saxophon) |
| | `rh_pinky_low_a` | Tiefe A-Klappe (Baritonsaxophon) |

## Holzblasinstrumente spezifisch

| Instrument | Code | Beschreibung |
|------------|------|--------------|
| **Flöte/Piccolo** | `rh_side_bb` | Seitliche Bb-Klappe (rechter Zeigefinger) |
| | `rh_side_c` | Seitliche C-Klappe |
| **Oboe** | `lh_octave` | 1. Oktavklappe |
| | `lh_whisper` | 2. Oktavklappe (halbautomatisch) |
| **Klarinetten** | `lh_thumb` | Daumenloch/Duodezimklappe |
| | `lh_octave` | Duodezimklappe (Registerklappe) |
| **Bassklarinette** | `lh_thumb_klappe1` | 1. Daumenklappe (tiefste Töne) |
| | `lh_thumb_klappe2` | 2. Daumenklappe |
| | `lh_thumb_klappe3` | 3. Daumenklappe |
| | `lh_thumb_klappe4` | 4. Daumenklappe |
| **Fagott** | `rh_thumb_c` | Rechter Daumen C-Klappe |
| | `rh_thumb_f` | Rechter Daumen F-Klappe |
| | `rh_thumb_eb` | Rechter Daumen Eb-Klappe |
| | `rh_thumb_bb` | Rechter Daumen Bb-Klappe |
| | `lh_thumb_low_b` | Linker Daumen tiefe B-Klappe |
| | `lh_thumb_low_bb` | Linker Daumen tiefe Bb-Klappe |
| | `lh1:half` | Linker Zeigefinger halb geschlossen |
| | `lh1:three_quarter` | Linker Zeigefinger dreiviertel geschlossen |
| **Saxophone** | `lh_thumb` | Oktavklappe (ab E5) |
| | `lh_palm_d` | Handballen-Klappe D (hohe Lage) |
| | `lh_palm_eb` | Handballen-Klappe Eb (hohe Lage) |
| | `lh_palm_f` | Handballen-Klappe F (hohe Lage) |
| | `rh_side_bb` | Seitliche Bb-Klappe |
| | `rh_side_c` | Seitliche C-Klappe |
| | `rh_side_e` | Seitliche E-Klappe |
| | `lh_front_f` | Front-F-Klappe (Altissimo) |

## Blechblasinstrumente

| Kategorie | Code | Beschreibung |
|-----------|------|--------------|
| **Ventile** | `v1` | 1. Ventil (ganzer Ton) |
| | `v2` | 2. Ventil (halber Ton) |
| | `v3` | 3. Ventil (anderthalb Töne) |
| | `v4` | 4. Ventil (Quartventil / Erweiterung) |
| | `v5` | 5. Ventil (nur große Tuben) |
| **Waldhorn** | `trigger_f` | Daumenventil (Umschaltung F/B) |
| **Posaune** | `pos1` bis `pos7` | Zugpositionen 1 (ganz oben) bis 7 (ganz unten) |
| | `trigger_f` | Quartventil (F-Ventil) |

## Spezielle Notationen

| Notation | Bedeutung | Beispiel |
|----------|-----------|----------|
| `["lh1", "lh2"]` | Nur die aufgeführten Tasten werden gedrückt | Standard-Griff |
| `[]` | Leeres Array = alle Finger offen | B4 beim Saxophon |
| `"lh1:half"` | Halb geschlossenes Loch | Fagott G3 |
| `"lh1:three_quarter"` | Dreiviertel geschlossenes Loch | Fagott A3 |

## Zusammenfassung nach Instrumentenfamilien

### Holzbläser (allgemein)
- `lh1, lh2, lh3` - Linke Hand Zeige-, Mittel-, Ringfinger
- `rh1, rh2, rh3` - Rechte Hand Zeige-, Mittel-, Ringfinger
- `lh_thumb` - Linker Daumen (B-Klappe/Oktavklappe)
- `lh_pinky_gs` - G#-Klappe (linker kleiner Finger)
- `rh_pinky_eb` - Es-Klappe (rechter kleiner Finger)

### Flötenfamilie (Flöte, Piccolo)
- `rh_side_bb` - Seitliche Bb-Klappe
- `rh_side_c` - Seitliche C-Klappe
- `rh_pinky_low_c` - Tiefe C-Klappe

### Rohrblattinstrumente (Oboe, Klarinetten, Fagott)
- `lh_octave` - Oktav-/Duodezimklappe
- `lh_whisper` - Whisper-/Flick-Klappe
- Diverse Daumenklappen für tiefe Töne

### Saxophone
- `lh_palm_d, lh_palm_eb, lh_palm_f` - Handballen-Klappen
- `rh_side_bb, rh_side_c, rh_side_e` - Seitenklappen
- `lh_front_f` - Front-F-Klappe
- `rh_pinky_low_a` - Tiefe A-Klappe (Bariton)

### Blechbläser
- `v1, v2, v3, v4, v5` - Ventile
- `trigger_f` - Quartventil / F-Umschaltung
- `pos1` bis `pos7` - Posaunenzugpositionen

