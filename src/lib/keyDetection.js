import { NOTES, FLAT_NOTES, SCALES } from './musicData.js';
import { getChordNotes } from './chordParser.js';

/**
 * PROPER KEY DETECTION ALGORITHM
 *
 * Music Theory Principles:
 * 1. A progression is in a diatonic key when ALL chords are built from that key's scale
 * 2. Chord QUALITY must match the expected quality for that scale degree
 * 3. Major/minor keys are prioritized over modes and exotic scales
 * 4. Functional harmony (I-IV-V, ii-V-I, etc.) increases confidence
 * 5. Only consider non-diatonic keys if no diatonic key fits
 */

// Define priority tiers for scales
const SCALE_PRIORITY = {
  // Tier 1: Primary diatonic keys
  'major': 1,
  'natural_minor': 1,
  'harmonic_minor': 1,
  'melodic_minor': 1,

  // Tier 2: Common modes
  'dorian': 2,
  'mixolydian': 2,
  'phrygian': 2,
  'lydian': 2,
  'aeolian': 2,

  // Tier 3: Jazz scales
  'bebop_major': 3,
  'bebop_dominant': 3,
  'bebop_minor': 3,
  'lydian_dominant': 3,
  'altered': 3,

  // Tier 4: Exotic scales (only if nothing else fits)
  'whole_tone': 4,
  'diminished_whole_half': 4,
  'diminished_half_whole': 4,

  // Never use these as key centers
  'chromatic': 999,
  'augmented': 999
};

/**
 * Get expected chord quality for each scale degree in major and minor keys
 */
const EXPECTED_QUALITIES = {
  'major': {
    1: ['major', 'maj7', '6', 'maj9', 'maj13', 'add9'],
    2: ['minor', 'm7', 'm9', 'm11'],
    3: ['minor', 'm7', 'm9'],
    4: ['major', 'maj7', '6'],
    5: ['major', '7', 'dominant7', '9', '13'],  // Can be major or dominant
    6: ['minor', 'm7', 'm9'],
    7: ['diminished', 'dim7', 'm7b5', 'half_diminished']
  },
  'natural_minor': {
    1: ['minor', 'm7', 'm9', 'm11'],
    2: ['diminished', 'dim7', 'm7b5'],
    3: ['major', 'maj7', '6'],
    4: ['minor', 'm7', 'm9'],
    5: ['minor', 'm7', 'm9'],  // Natural minor has minor v
    6: ['major', 'maj7', '6'],
    7: ['major', '7', 'dominant7']
  },
  'harmonic_minor': {
    1: ['minor', 'm7', 'mmaj7', 'minmaj7'],
    2: ['diminished', 'dim7', 'm7b5'],
    3: ['augmented', 'aug', 'maj7'],
    4: ['minor', 'm7'],
    5: ['major', '7', 'dominant7'],  // Dominant V in harmonic minor
    6: ['major', 'maj7'],
    7: ['diminished', 'dim7']
  }
};

/**
 * Detects possible keys with PROPER music theory
 */
export function detectKeys(chordProgression) {
  if (!chordProgression || chordProgression.length === 0) {
    return [];
  }

  // First, try to find diatonic keys (Tier 1 only)
  const diatonicKeys = findDiatonicKeys(chordProgression);

  // If we found strong diatonic matches, only return those
  if (diatonicKeys.length > 0 && diatonicKeys[0].confidence >= 80) {
    return diatonicKeys;
  }

  // If no strong diatonic match, expand to modes (Tier 2)
  const modalKeys = findModalKeys(chordProgression);

  if (modalKeys.length > 0 && modalKeys[0].confidence >= 70) {
    return [...diatonicKeys, ...modalKeys].sort((a, b) => b.confidence - a.confidence);
  }

  // If still no good match, try jazz scales (Tier 3)
  const jazzKeys = findJazzKeys(chordProgression);

  // Return all possibilities, sorted by confidence
  return [...diatonicKeys, ...modalKeys, ...jazzKeys]
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Find diatonic major/minor keys (highest priority)
 */
function findDiatonicKeys(chordProgression) {
  const possibilities = [];
  const diatonicScales = ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor'];

  for (const root of NOTES) {
    for (const scaleName of diatonicScales) {
      const result = analyzeKeyMatch(chordProgression, root, scaleName);

      // Only include if ALL chords are diatonic
      if (result && result.diatonicPercentage === 100) {
        possibilities.push(result);
      }
    }
  }

  return possibilities.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Find modal keys (medium priority)
 */
function findModalKeys(chordProgression) {
  const possibilities = [];
  const modalScales = ['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];

  for (const root of NOTES) {
    for (const scaleName of modalScales) {
      const result = analyzeKeyMatch(chordProgression, root, scaleName);

      // Require at least 75% diatonic for modes
      if (result && result.diatonicPercentage >= 75) {
        possibilities.push(result);
      }
    }
  }

  return possibilities.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Find jazz/exotic keys (lowest priority)
 */
function findJazzKeys(chordProgression) {
  const possibilities = [];
  const jazzScales = Object.keys(SCALES).filter(scale => {
    const priority = SCALE_PRIORITY[scale] || 4;
    return priority === 3 || priority === 4;
  }).filter(scale => !['chromatic', 'augmented'].includes(scale));

  for (const root of NOTES) {
    for (const scaleName of jazzScales) {
      const result = analyzeKeyMatch(chordProgression, root, scaleName);

      // Require at least 70% diatonic for jazz scales
      if (result && result.diatonicPercentage >= 70) {
        possibilities.push(result);
      }
    }
  }

  return possibilities.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Analyze how well a progression fits a specific key
 * This checks both NOTES and CHORD QUALITY
 */
function analyzeKeyMatch(progression, root, scaleName) {
  const scaleIntervals = SCALES[scaleName];
  if (!scaleIntervals) return null;

  const scaleNotes = scaleIntervals.map(interval => {
    const noteIndex = (NOTES.indexOf(root) + interval) % 12;
    return NOTES[noteIndex];
  });

  // Analyze each chord in the progression
  const chordAnalyses = progression.map(chord => {
    if (!chord.parsed) return null;

    const chordRoot = normalizeNote(chord.parsed.root);
    const normalizedScale = scaleNotes.map(normalizeNote);
    const degreeIndex = normalizedScale.indexOf(chordRoot);

    if (degreeIndex === -1) {
      return {
        chord: chord.original,
        degree: null,
        isDiatonic: false,
        qualityMatch: false
      };
    }

    const degree = degreeIndex + 1;
    const qualityMatch = checkQualityMatch(
      chord.parsed.quality,
      degree,
      scaleName
    );

    return {
      chord: chord.original,
      root: chord.parsed.root,
      quality: chord.parsed.quality,
      degree,
      isDiatonic: qualityMatch,  // Only truly diatonic if quality matches
      qualityMatch,
      romanNumeral: toRomanNumeral(degree, chord.parsed.quality)
    };
  }).filter(a => a !== null);

  // Calculate metrics
  const diatonicChords = chordAnalyses.filter(a => a.isDiatonic);
  const diatonicPercentage = (diatonicChords.length / chordAnalyses.length) * 100;

  // Don't consider this key if diatonic percentage is too low
  if (diatonicPercentage < 50) return null;

  // Detect common progressions
  const progressionPattern = detectProgressionPattern(chordAnalyses);
  const hasCadence = detectCadence(chordAnalyses);
  const hasTonicResolution = chordAnalyses.some(a => a.degree === 1);

  // Calculate confidence based on proper music theory
  const confidence = calculateConfidence({
    diatonicPercentage,
    scaleName,
    progressionPattern,
    hasCadence,
    hasTonicResolution,
    chordAnalyses
  });

  return {
    root,
    scale: scaleName,
    scaleNotes,
    analysis: {
      chords: chordAnalyses,
      pattern: progressionPattern,
      hasStrongCadence: hasCadence,
      diatonicPercentage
    },
    confidence,
    fitness: {
      diatonicPercentage,
      totalChords: chordAnalyses.length,
      diatonicChords: diatonicChords.length
    }
  };
}

/**
 * Check if chord quality matches expected quality for scale degree
 * THIS IS THE KEY FUNCTION - checks quality, not just notes
 */
function checkQualityMatch(actualQuality, degree, scaleName) {
  // Get expected qualities for this scale
  let expectedQualities = null;

  if (scaleName === 'major' || scaleName === 'ionian') {
    expectedQualities = EXPECTED_QUALITIES['major'][degree];
  } else if (scaleName === 'natural_minor' || scaleName === 'aeolian') {
    expectedQualities = EXPECTED_QUALITIES['natural_minor'][degree];
  } else if (scaleName === 'harmonic_minor') {
    expectedQualities = EXPECTED_QUALITIES['harmonic_minor'][degree];
  } else {
    // For other scales, use a more lenient check
    return true;
  }

  if (!expectedQualities) return false;

  // Normalize quality for comparison
  const normalized = actualQuality.toLowerCase();

  // Check if actual quality matches any expected quality
  for (const expected of expectedQualities) {
    if (normalized.includes(expected.toLowerCase())) {
      return true;
    }

    // Special cases
    if (expected === 'major' && !normalized.includes('minor') &&
        !normalized.includes('dim') && !normalized.includes('aug')) {
      return true;
    }

    if (expected === 'minor' && normalized.includes('m')) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate confidence with proper weighting
 */
function calculateConfidence(params) {
  const {
    diatonicPercentage,
    scaleName,
    progressionPattern,
    hasCadence,
    hasTonicResolution,
    chordAnalyses
  } = params;

  let score = 0;

  // Diatonic percentage is most important (60 points)
  score += (diatonicPercentage / 100) * 60;

  // Scale priority (20 points)
  const priority = SCALE_PRIORITY[scaleName] || 4;
  if (priority === 1) score += 20;
  else if (priority === 2) score += 15;
  else if (priority === 3) score += 10;
  else score += 5;

  // Common progression pattern (10 points)
  if (progressionPattern) score += 10;

  // Cadence (5 points)
  if (hasCadence) score += 5;

  // Tonic resolution (5 points)
  if (hasTonicResolution) score += 5;

  // Bonus for all chords being diatonic
  if (diatonicPercentage === 100) score += 10;

  return Math.min(100, score);
}

/**
 * Detect common progression patterns
 */
function detectProgressionPattern(analysis) {
  if (analysis.length < 2) return null;

  const degrees = analysis.map(a => a.degree).filter(d => d !== null);

  // I-V-vi-IV (pop progression)
  if (degrees.length >= 4) {
    const pattern = degrees.join('-');
    if (pattern.includes('1-5-6-4')) return 'I-V-vi-IV (Pop Progression)';
    if (pattern.includes('6-4-1-5')) return 'vi-IV-I-V (Pop Progression variant)';
  }

  // ii-V-I (jazz)
  if (degrees.length >= 3) {
    for (let i = 0; i <= degrees.length - 3; i++) {
      if (degrees[i] === 2 && degrees[i + 1] === 5 && degrees[i + 2] === 1) {
        return 'ii-V-I (Jazz Turnaround)';
      }
    }
  }

  // I-IV-V (blues/rock)
  if (degrees.length >= 3) {
    const pattern = degrees.join('-');
    if (pattern.includes('1-4-5')) return 'I-IV-V (Blues/Rock)';
  }

  // I-vi-IV-V (50s progression)
  if (degrees.length >= 4) {
    const pattern = degrees.join('-');
    if (pattern.includes('1-6-4-5')) return 'I-vi-IV-V (50s Progression)';
  }

  return null;
}

/**
 * Detect cadences
 */
function detectCadence(analysis) {
  if (analysis.length < 2) return false;

  const lastTwo = analysis.slice(-2);
  const degrees = lastTwo.map(a => a.degree).filter(d => d !== null);

  if (degrees.length < 2) return false;

  // V-I (Perfect Cadence)
  if (degrees[0] === 5 && degrees[1] === 1) return true;

  // IV-I (Plagal Cadence)
  if (degrees[0] === 4 && degrees[1] === 1) return true;

  return false;
}

/**
 * Convert to Roman numeral
 */
function toRomanNumeral(degree, quality) {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  let numeral = numerals[degree - 1] || '?';

  const normalized = quality.toLowerCase();

  // Use lowercase for minor/diminished
  if (normalized.includes('minor') || normalized.includes('m7') || normalized.includes('m9')) {
    numeral = numeral.toLowerCase();
  } else if (normalized.includes('diminished') || normalized.includes('dim')) {
    numeral = numeral.toLowerCase() + '°';
  } else if (normalized.includes('augmented') || normalized.includes('aug')) {
    numeral = numeral + '+';
  }

  return numeral;
}

/**
 * Normalize note
 */
function normalizeNote(note) {
  const map = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  return map[note] || note;
}

/**
 * Determine if progression is atonal
 */
export function isAtonal(possibilities) {
  if (possibilities.length === 0) return true;

  const bestMatch = possibilities[0];

  // If best match has less than 60% confidence and isn't fully diatonic, likely atonal
  return bestMatch.confidence < 60 && bestMatch.fitness.diatonicPercentage < 100;
}

/**
 * Get human-readable key description
 */
export function describeKey(keyInfo) {
  if (!keyInfo) return 'Unknown';

  const scaleNames = {
    'major': 'Major',
    'natural_minor': 'Minor',
    'harmonic_minor': 'Harmonic Minor',
    'melodic_minor': 'Melodic Minor',
    'dorian': 'Dorian',
    'phrygian': 'Phrygian',
    'lydian': 'Lydian',
    'mixolydian': 'Mixolydian',
    'aeolian': 'Minor (Aeolian)',
    'locrian': 'Locrian'
  };

  const scaleDesc = scaleNames[keyInfo.scale] || keyInfo.scale.replace(/_/g, ' ');

  return `${keyInfo.root} ${scaleDesc}`;
}
