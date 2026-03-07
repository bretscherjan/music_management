export const KEY_LABELS: Record<string, string> = {
  // Haupthand links
  lh1: "Li. Zeigefinger",
  lh2: "Li. Mittelfinger",
  lh3: "Li. Ringfinger",

  // Haupthand rechts
  rh1: "Re. Zeigefinger",
  rh2: "Re. Mittelfinger",
  rh3: "Re. Ringfinger",

  // Daumen & Oktavklappe
  lh_thumb: "Li. Daumen / Oktavklappe",
  lh_octave: "Oktavklappe",
  lh_whisper: "Whisper-Klappe",

  // Kleinfinger links
  lh_pinky_gs: "G#-Klappe (li.)",
  lh_pinky_low_b: "Tiefe B-Klappe (li.)",
  lh_pinky_low_bb: "Tiefe Bb-Klappe (li.)",

  // Kleinfinger rechts
  rh_pinky_eb: "Es-Klappe (re.)",
  rh_pinky_low_c: "Tiefe C-Klappe (re.)",
  rh_pinky_low_cs: "Tiefe C#-Klappe (re.)",
  rh_pinky_low_a: "Tiefe A-Klappe (Bariton)",

  // Flöte / Piccolo
  rh_side_bb: "Seitl. Bb-Klappe",
  rh_side_c: "Seitl. C-Klappe",
  rh_side_e: "Seitl. E-Klappe",

  // Saxophone – Handballen & Seitenklappen
  lh_palm_d: "Handballen D",
  lh_palm_eb: "Handballen Eb",
  lh_palm_f: "Handballen F",
  lh_front_f: "Front-F-Klappe",

  // Bassklarinette – Daumenklappen
  lh_thumb_klappe1: "1. Daumenklappe",
  lh_thumb_klappe2: "2. Daumenklappe",
  lh_thumb_klappe3: "3. Daumenklappe",
  lh_thumb_klappe4: "4. Daumenklappe",

  // Fagott
  rh_thumb_c: "Re. Daumen C",
  rh_thumb_f: "Re. Daumen F",
  rh_thumb_eb: "Re. Daumen Eb",
  rh_thumb_bb: "Re. Daumen Bb",
  lh_thumb_low_b: "Li. Daumen tiefe B",
  lh_thumb_low_bb: "Li. Daumen tiefe Bb",
  "lh1:half": "Li. Zeigefinger (½)",
  "lh1:three_quarter": "Li. Zeigefinger (¾)",

  // Blechbläser – Ventile
  v1: "1. Ventil",
  v2: "2. Ventil",
  v3: "3. Ventil",
  v4: "4. Ventil",
  v5: "5. Ventil",
  trigger_f: "F-Ventil",

  // Posaune – Zugpositionen
  pos1: "Position 1",
  pos2: "Position 2",
  pos3: "Position 3",
  pos4: "Position 4",
  pos5: "Position 5",
  pos6: "Position 6",
  pos7: "Position 7",
};

export function labelKey(key: string): string {
  return KEY_LABELS[key] ?? key;
}
