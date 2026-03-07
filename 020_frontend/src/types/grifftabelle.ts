export interface GrifftabelleTrill {
  to: string;
  fingering: string[];
}

export interface GrifftabelleAlternative {
  description: string;
  fingering: string[];
}

export interface GrifftabelleFingering {
  note: string;
  standard: string[];
  alternatives: GrifftabelleAlternative[];
  trills: GrifftabelleTrill[];
}

export interface GrifftabelleRange {
  min: string;
  max: string;
}

export interface GrifftabelleMetadata {
  name: string;
  transposition: string;
  range: GrifftabelleRange;
}

export interface GrifftabelleInstrument {
  instrumentId: string;
  metadata: GrifftabelleMetadata;
  fingerings: GrifftabelleFingering[];
}
