// Comprehensive music theory data models

// Notes in chromatic scale
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Note enharmonic equivalents
export const ENHARMONICS = {
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#'
};

// Intervals in semitones
export const INTERVALS = {
  'P1': 0,  // Perfect unison
  'm2': 1,  // Minor second
  'M2': 2,  // Major second
  'm3': 3,  // Minor third
  'M3': 4,  // Major third
  'P4': 5,  // Perfect fourth
  'TT': 6,  // Tritone
  'P5': 7,  // Perfect fifth
  'm6': 8,  // Minor sixth
  'M6': 9,  // Major sixth
  'm7': 10, // Minor seventh
  'M7': 11, // Major seventh
  'P8': 12  // Perfect octave
};

// Scale formulas (in semitones from root)
export const SCALES = {
  // Major and modes
  'major': [0, 2, 4, 5, 7, 9, 11],
  'ionian': [0, 2, 4, 5, 7, 9, 11],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'aeolian': [0, 2, 3, 5, 7, 8, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],

  // Minor scales
  'natural_minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic_minor': [0, 2, 3, 5, 7, 9, 11],

  // Melodic minor modes
  'dorian_b2': [0, 1, 3, 5, 7, 9, 10],
  'lydian_augmented': [0, 2, 4, 6, 8, 9, 11],
  'lydian_dominant': [0, 2, 4, 6, 7, 9, 10],
  'mixolydian_b6': [0, 2, 4, 5, 7, 8, 10],
  'locrian_natural_2': [0, 2, 3, 5, 6, 8, 10],
  'altered': [0, 1, 3, 4, 6, 8, 10],
  'super_locrian': [0, 1, 3, 4, 6, 8, 10],

  // Harmonic minor modes
  'locrian_natural_6': [0, 1, 3, 5, 6, 9, 10],
  'ionian_#5': [0, 2, 4, 5, 8, 9, 11],
  'dorian_#4': [0, 2, 3, 6, 7, 9, 10],
  'phrygian_dominant': [0, 1, 4, 5, 7, 8, 10],
  'lydian_#2': [0, 3, 4, 6, 7, 9, 11],
  'ultralocrian': [0, 1, 3, 4, 6, 8, 9],

  // Pentatonic
  'major_pentatonic': [0, 2, 4, 7, 9],
  'minor_pentatonic': [0, 3, 5, 7, 10],

  // Blues
  'blues': [0, 3, 5, 6, 7, 10],
  'major_blues': [0, 2, 3, 4, 7, 9],

  // Bebop scales
  'bebop_major': [0, 2, 4, 5, 7, 8, 9, 11],
  'bebop_dominant': [0, 2, 4, 5, 7, 9, 10, 11],
  'bebop_minor': [0, 2, 3, 5, 7, 8, 9, 10],
  'bebop_dorian': [0, 2, 3, 4, 5, 7, 9, 10],

  // Exotic/World scales
  'whole_tone': [0, 2, 4, 6, 8, 10],
  'diminished_whole_half': [0, 2, 3, 5, 6, 8, 9, 11],
  'diminished_half_whole': [0, 1, 3, 4, 6, 7, 9, 10],
  'augmented': [0, 3, 4, 7, 8, 11],
  'prometheus': [0, 2, 4, 6, 9, 10],
  'tritone': [0, 1, 4, 6, 7, 10],
  'enigmatic': [0, 1, 4, 6, 8, 10, 11],
  'double_harmonic': [0, 1, 4, 5, 7, 8, 11],
  'hungarian_minor': [0, 2, 3, 6, 7, 8, 11],
  'hungarian_major': [0, 3, 4, 6, 7, 9, 10],
  'neapolitan_major': [0, 1, 3, 5, 7, 9, 11],
  'neapolitan_minor': [0, 1, 3, 5, 7, 8, 11],
  'persian': [0, 1, 4, 5, 6, 8, 11],
  'arabian': [0, 2, 4, 5, 6, 8, 10],
  'byzantine': [0, 1, 4, 5, 7, 8, 11],
  'flamenco': [0, 1, 4, 5, 7, 8, 11],
  'gypsy': [0, 2, 3, 6, 7, 8, 11],
  'spanish_phrygian': [0, 1, 4, 5, 7, 8, 10],
  'hirajoshi': [0, 2, 3, 7, 8],
  'in_sen': [0, 1, 5, 7, 10],
  'iwato': [0, 1, 5, 6, 10],
  'kumoi': [0, 2, 3, 7, 9],
  'pelog': [0, 1, 3, 7, 8],
  'yo': [0, 3, 5, 7, 10],
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

// Chord formulas (intervals from root)
export const CHORD_FORMULAS = {
  // Triads
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  'diminished': [0, 3, 6],
  'augmented': [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],

  // Seventh chords
  'maj7': [0, 4, 7, 11],
  'dominant7': [0, 4, 7, 10],
  '7': [0, 4, 7, 10],
  'min7': [0, 3, 7, 10],
  'm7': [0, 3, 7, 10],
  'min7b5': [0, 3, 6, 10],
  'm7b5': [0, 3, 6, 10],
  'half_diminished': [0, 3, 6, 10],
  'dim7': [0, 3, 6, 9],
  'diminished7': [0, 3, 6, 9],
  'aug7': [0, 4, 8, 10],
  'augmaj7': [0, 4, 8, 11],
  'maj7#5': [0, 4, 8, 11],
  'minmaj7': [0, 3, 7, 11],
  'mmaj7': [0, 3, 7, 11],

  // Sixth chords
  '6': [0, 4, 7, 9],
  'min6': [0, 3, 7, 9],
  'm6': [0, 3, 7, 9],
  '6/9': [0, 4, 7, 9, 14],

  // Extended chords (9th, 11th, 13th)
  '9': [0, 4, 7, 10, 14],
  'maj9': [0, 4, 7, 11, 14],
  'min9': [0, 3, 7, 10, 14],
  'm9': [0, 3, 7, 10, 14],
  'add9': [0, 4, 7, 14],
  'madd9': [0, 3, 7, 14],

  '11': [0, 4, 7, 10, 14, 17],
  'maj11': [0, 4, 7, 11, 14, 17],
  'min11': [0, 3, 7, 10, 14, 17],
  'm11': [0, 3, 7, 10, 14, 17],

  '13': [0, 4, 7, 10, 14, 21],
  'maj13': [0, 4, 7, 11, 14, 21],
  'min13': [0, 3, 7, 10, 14, 21],
  'm13': [0, 3, 7, 10, 14, 21],

  // Altered extensions
  '7b9': [0, 4, 7, 10, 13],
  '7#9': [0, 4, 7, 10, 15],
  '7b5': [0, 4, 6, 10],
  '7#5': [0, 4, 8, 10],
  '7#11': [0, 4, 7, 10, 18],
  '7b13': [0, 4, 7, 10, 20],
  'maj7#11': [0, 4, 7, 11, 18],
  'min7#11': [0, 3, 7, 10, 18],
  'm7#11': [0, 3, 7, 10, 18],
  '9#11': [0, 4, 7, 10, 14, 18],
  '13#11': [0, 4, 7, 10, 14, 18, 21],
  '7alt': [0, 4, 6, 10, 13, 15], // altered dominant

  // Power chord
  '5': [0, 7]
};

// Chord quality and function mappings
export const CHORD_QUALITIES = {
  'major': ['major', 'maj7', '6', '6/9', 'maj9', 'maj11', 'maj13', 'add9', 'maj7#11', 'maj7#5'],
  'minor': ['minor', 'm7', 'min7', 'm9', 'min9', 'm11', 'min11', 'm13', 'min13', 'm6', 'min6', 'madd9', 'mmaj7', 'minmaj7', 'm7#11', 'min7#11'],
  'dominant': ['7', 'dominant7', '9', '11', '13', '7b9', '7#9', '7b5', '7#5', '7#11', '7b13', '7alt', '9#11', '13#11'],
  'diminished': ['diminished', 'dim7', 'diminished7', 'm7b5', 'min7b5', 'half_diminished'],
  'augmented': ['augmented', 'aug7', 'augmaj7'],
  'suspended': ['sus2', 'sus4']
};

// Guitar standard tuning (low to high)
export const GUITAR_TUNING = [
  { string: 6, note: 'E', octave: 2 },
  { string: 5, note: 'A', octave: 2 },
  { string: 4, note: 'D', octave: 3 },
  { string: 3, note: 'G', octave: 3 },
  { string: 2, note: 'B', octave: 3 },
  { string: 1, note: 'E', octave: 4 }
];

// Scale degree names
export const DEGREE_NAMES = {
  1: 'Root/Tonic',
  2: 'Supertonic',
  3: 'Mediant',
  4: 'Subdominant',
  5: 'Dominant',
  6: 'Submediant',
  7: 'Leading Tone/Subtonic'
};

// Harmonic function categories
export const FUNCTIONS = {
  'tonic': [1, 3, 6],
  'subdominant': [2, 4],
  'dominant': [5, 7]
};

// Common chord progressions and their characteristics
export const COMMON_PROGRESSIONS = {
  'I-IV-V': { name: 'Basic Blues/Rock', context: 'major', strength: 'strong' },
  'I-V-vi-IV': { name: 'Pop Progression', context: 'major', strength: 'strong' },
  'ii-V-I': { name: 'Jazz Turnaround', context: 'major', strength: 'strong' },
  'i-iv-v': { name: 'Minor Blues', context: 'minor', strength: 'strong' },
  'i-VII-VI-VII': { name: 'Andalusian Cadence', context: 'minor', strength: 'strong' },
  'I-vi-ii-V': { name: 'Circle Progression', context: 'major', strength: 'strong' }
};

// Approach note strategies
export const APPROACH_STRATEGIES = {
  'chromatic_below': { name: 'Chromatic from below', interval: -1 },
  'chromatic_above': { name: 'Chromatic from above', interval: 1 },
  'diatonic_below': { name: 'Diatonic from below', interval: -2 },
  'diatonic_above': { name: 'Diatonic from above', interval: 2 },
  'dominant_approach': { name: 'Dominant approach', interval: 7 },
  'enclosure': { name: 'Enclosure (chromatic)', interval: 'both' }
};

// Artist/style references for licks and approaches
export const STYLE_REFERENCES = {
  'bebop': {
    artists: ['Charlie Parker', 'Dizzy Gillespie', 'Bud Powell'],
    characteristics: ['chromatic approach', 'bebop scales', 'eighth note lines']
  },
  'blues': {
    artists: ['B.B. King', 'Albert King', 'Freddie King'],
    characteristics: ['blues scale', 'bends', 'call and response']
  },
  'jazz_guitar': {
    artists: ['Wes Montgomery', 'Joe Pass', 'Pat Metheny', 'George Benson'],
    characteristics: ['octaves', 'chord melody', 'block chords']
  },
  'fusion': {
    artists: ['John Scofield', 'Mike Stern', 'Allan Holdsworth'],
    characteristics: ['altered scales', 'wide intervals', 'legato']
  },
  'gypsy_jazz': {
    artists: ['Django Reinhardt', 'Bireli Lagrene'],
    characteristics: ['arpeggio sweeps', 'rest stroke', 'chromatic runs']
  }
};
