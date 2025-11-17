import { NOTES, SCALES } from './musicData.js';

/**
 * INTELLIGENT KEY DETECTION WITH HARMONIC FUNCTION ANALYSIS
 *
 * Music Theory Principles:
 * 1. Diatonic chords are those built from the scale
 * 2. Chromatic chords can still be FUNCTIONAL (secondary dominants, modal interchange, etc.)
 * 3. Analyze chord RELATIONSHIPS and RESOLUTION patterns
 * 4. Understand harmonic function beyond simple scale membership
 * 5. Voice leading and tendency tones matter
 */

const SCALE_PRIORITY = {
  'major': 1,
  'natural_minor': 1,
  'harmonic_minor': 1,
  'melodic_minor': 1,
  'dorian': 2,
  'mixolydian': 2,
  'phrygian': 2,
  'lydian': 2,
  'aeolian': 2,
  'locrian': 2,
  'bebop_major': 3,
  'bebop_dominant': 3,
  'bebop_minor': 3,
  'lydian_dominant': 3,
  'altered': 3,
  'chromatic': 999,
  'augmented': 999
};

// Expected diatonic chord qualities for major/minor keys
const EXPECTED_QUALITIES = {
  'major': {
    1: ['major', 'maj7', '6', 'maj9', 'maj13', 'add9'],
    2: ['minor', 'm7', 'm9', 'm11'],
    3: ['minor', 'm7', 'm9'],
    4: ['major', 'maj7', '6'],
    5: ['major', '7', 'dominant7', '9', '13'],
    6: ['minor', 'm7', 'm9'],
    7: ['diminished', 'dim7', 'm7b5', 'half_diminished']
  },
  'natural_minor': {
    1: ['minor', 'm7', 'm9', 'm11'],
    2: ['diminished', 'dim7', 'm7b5'],
    3: ['major', 'maj7', '6'],
    4: ['minor', 'm7', 'm9'],
    5: ['minor', 'm7', 'm9'],
    6: ['major', 'maj7', '6'],
    7: ['major', '7', 'dominant7']
  },
  'harmonic_minor': {
    1: ['minor', 'm7', 'mmaj7', 'minmaj7'],
    2: ['diminished', 'dim7', 'm7b5'],
    3: ['augmented', 'aug', 'maj7'],
    4: ['minor', 'm7'],
    5: ['major', '7', 'dominant7'],
    6: ['major', 'maj7'],
    7: ['diminished', 'dim7']
  }
};

export function detectKeys(chordProgression) {
  if (!chordProgression || chordProgression.length === 0) {
    return [];
  }

  // Try diatonic keys first
  const diatonicKeys = findDiatonicKeys(chordProgression);

  if (diatonicKeys.length > 0 && diatonicKeys[0].confidence >= 80) {
    return diatonicKeys;
  }

  // Expand to modes
  const modalKeys = findModalKeys(chordProgression);

  if (modalKeys.length > 0 && modalKeys[0].confidence >= 70) {
    return [...diatonicKeys, ...modalKeys].sort((a, b) => b.confidence - a.confidence);
  }

  // Try jazz scales
  const jazzKeys = findJazzKeys(chordProgression);

  return [...diatonicKeys, ...modalKeys, ...jazzKeys]
    .sort((a, b) => b.confidence - a.confidence);
}

function findDiatonicKeys(chordProgression) {
  const possibilities = [];
  const diatonicScales = ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor'];

  for (const root of NOTES) {
    for (const scaleName of diatonicScales) {
      const result = analyzeKeyMatch(chordProgression, root, scaleName);

      // Accept if all chords are either diatonic OR functionally chromatic
      if (result && result.functionalPercentage >= 90) {
        possibilities.push(result);
      }
    }
  }

  return possibilities.sort((a, b) => b.confidence - a.confidence);
}

function findModalKeys(chordProgression) {
  const possibilities = [];
  const modalScales = ['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];

  for (const root of NOTES) {
    for (const scaleName of modalScales) {
      const result = analyzeKeyMatch(chordProgression, root, scaleName);

      if (result && result.functionalPercentage >= 75) {
        possibilities.push(result);
      }
    }
  }

  return possibilities.sort((a, b) => b.confidence - a.confidence);
}

function findJazzKeys(chordProgression) {
  const possibilities = [];
  const jazzScales = Object.keys(SCALES).filter(scale => {
    const priority = SCALE_PRIORITY[scale] || 4;
    return priority === 3 || priority === 4;
  }).filter(scale => !['chromatic', 'augmented'].includes(scale));

  for (const root of NOTES) {
    for (const scaleName of jazzScales) {
      const result = analyzeKeyMatch(chordProgression, root, scaleName);

      if (result && result.functionalPercentage >= 70) {
        possibilities.push(result);
      }
    }
  }

  return possibilities.sort((a, b) => b.confidence - a.confidence);
}

/**
 * INTELLIGENT KEY MATCHING - Analyzes harmonic function, not just notes
 */
function analyzeKeyMatch(progression, root, scaleName) {
  const scaleIntervals = SCALES[scaleName];
  if (!scaleIntervals) return null;

  const scaleNotes = scaleIntervals.map(interval => {
    const noteIndex = (NOTES.indexOf(root) + interval) % 12;
    return NOTES[noteIndex];
  });

  // Analyze each chord with context (previous and next chords)
  const chordAnalyses = progression.map((chord, index) => {
    if (!chord.parsed) return null;

    const previous = index > 0 ? progression[index - 1] : null;
    const next = index < progression.length - 1 ? progression[index + 1] : null;

    return analyzeChordInContext(
      chord,
      previous,
      next,
      root,
      scaleName,
      scaleNotes
    );
  }).filter(a => a !== null);

  // Calculate functional percentage (diatonic + functional chromatic)
  const functionalChords = chordAnalyses.filter(a =>
    a.isDiatonic || a.chromaticFunction !== null
  );
  const functionalPercentage = (functionalChords.length / chordAnalyses.length) * 100;

  // Must have at least 50% functional chords
  if (functionalPercentage < 50) return null;

  const diatonicPercentage = (chordAnalyses.filter(a => a.isDiatonic).length / chordAnalyses.length) * 100;

  const progressionPattern = detectProgressionPattern(chordAnalyses);
  const hasCadence = detectCadence(chordAnalyses);
  const hasTonicResolution = chordAnalyses.some(a => a.degree === 1);

  const confidence = calculateConfidence({
    diatonicPercentage,
    functionalPercentage,
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
      diatonicPercentage,
      functionalPercentage
    },
    confidence,
    fitness: {
      diatonicPercentage,
      functionalPercentage,
      totalChords: chordAnalyses.length,
      diatonicChords: chordAnalyses.filter(a => a.isDiatonic).length,
      functionalChords: functionalChords.length
    }
  };
}

/**
 * ANALYZE CHORD IN CONTEXT - The heart of intelligent analysis
 * Determines if a chord is diatonic, or functionally chromatic
 */
function analyzeChordInContext(chord, previous, next, keyRoot, scaleName, scaleNotes) {
  const chordRoot = normalizeNote(chord.parsed.root);
  const normalizedScale = scaleNotes.map(normalizeNote);
  const degreeIndex = normalizedScale.indexOf(chordRoot);

  // Check if chord root is in the scale
  if (degreeIndex === -1) {
    // Chord is chromatic - but is it FUNCTIONAL?
    const chromaticFunction = analyzeChromaticFunction(
      chord,
      previous,
      next,
      keyRoot,
      scaleName,
      scaleNotes
    );

    return {
      chord: chord.original,
      root: chord.parsed.root,
      quality: chord.parsed.quality,
      degree: null,
      isDiatonic: false,
      chromaticFunction,
      romanNumeral: chromaticFunction?.romanNumeral || '?',
      function: chromaticFunction?.function || 'Non-functional chromatic'
    };
  }

  // Chord root is in scale - check quality
  const degree = degreeIndex + 1;
  const qualityMatch = checkQualityMatch(chord.parsed.quality, degree, scaleName);

  if (qualityMatch) {
    // Perfectly diatonic
    return {
      chord: chord.original,
      root: chord.parsed.root,
      quality: chord.parsed.quality,
      degree,
      isDiatonic: true,
      chromaticFunction: null,
      romanNumeral: toRomanNumeral(degree, chord.parsed.quality),
      function: getHarmonicFunction(degree, chord.parsed.quality, scaleName)
    };
  } else {
    // Root is in scale but quality is altered - likely functional
    const chromaticFunction = analyzeChromaticFunction(
      chord,
      previous,
      next,
      keyRoot,
      scaleName,
      scaleNotes
    );

    return {
      chord: chord.original,
      root: chord.parsed.root,
      quality: chord.parsed.quality,
      degree,
      isDiatonic: false,
      chromaticFunction,
      romanNumeral: chromaticFunction?.romanNumeral || toRomanNumeral(degree, chord.parsed.quality),
      function: chromaticFunction?.function || 'Altered diatonic'
    };
  }
}

/**
 * ANALYZE CHROMATIC FUNCTION
 * Determines if a chromatic chord serves a functional purpose
 */
function analyzeChromaticFunction(chord, previous, next, keyRoot, scaleName, scaleNotes) {
  const chordRoot = normalizeNote(chord.parsed.root);
  const chordQuality = chord.parsed.quality.toLowerCase();

  // 1. SECONDARY DOMINANT - Dominant chord resolving to a diatonic chord
  if (chordQuality.includes('7') && !chordQuality.includes('maj7')) {
    if (next && next.parsed) {
      const targetRoot = normalizeNote(next.parsed.root);
      const interval = getInterval(chordRoot, targetRoot);

      // Dominant resolves down a fifth (or up a fourth)
      if (interval === 7 || interval === 5) {
        const targetDegree = scaleNotes.map(normalizeNote).indexOf(targetRoot) + 1;
        if (targetDegree > 0) {
          return {
            type: 'secondary_dominant',
            function: `V/${getRomanNumeral(targetDegree)} - Secondary dominant`,
            romanNumeral: `V/${getRomanNumeral(targetDegree)}`,
            resolves_to: next.original
          };
        }
      }
    }
  }

  // 2. MODAL INTERCHANGE - Borrowed from parallel major/minor
  const modalInterchange = detectModalInterchange(chord, keyRoot, scaleName, scaleNotes);
  if (modalInterchange) {
    return modalInterchange;
  }

  // 3. TRITONE SUBSTITUTION - subV7
  if (chordQuality.includes('7') && !chordQuality.includes('maj7')) {
    const tritoneSubstitute = detectTritoneSubstitution(chord, next, keyRoot, scaleNotes);
    if (tritoneSubstitute) {
      return tritoneSubstitute;
    }
  }

  // 4. DIMINISHED PASSING CHORD
  if (chordQuality.includes('dim')) {
    const passingChord = detectPassingChord(chord, previous, next, scaleNotes);
    if (passingChord) {
      return passingChord;
    }
  }

  // 5. CHROMATIC MEDIANT
  if (previous && previous.parsed) {
    const prevRoot = normalizeNote(previous.parsed.root);
    const interval = getInterval(prevRoot, chordRoot);
    if ([3, 4, 8, 9].includes(interval)) { // Minor/major third relationships
      return {
        type: 'chromatic_mediant',
        function: 'Chromatic mediant - coloristic harmony',
        romanNumeral: '♭III or ♯III'
      };
    }
  }

  // 6. NEAPOLITAN CHORD (bII)
  const keyRootIndex = NOTES.indexOf(normalizeNote(keyRoot));
  const flatTwo = NOTES[(keyRootIndex + 1) % 12];
  if (chordRoot === flatTwo && chordQuality.includes('major')) {
    return {
      type: 'neapolitan',
      function: 'Neapolitan sixth (♭II) - pre-dominant function',
      romanNumeral: '♭II'
    };
  }

  return null;
}

/**
 * Detect modal interchange (borrowed chords)
 */
function detectModalInterchange(chord, keyRoot, scaleName, scaleNotes) {
  const chordRoot = normalizeNote(chord.parsed.root);
  const chordQuality = chord.parsed.quality.toLowerCase();

  // Common modal interchange from parallel minor (when in major)
  if (scaleName === 'major') {
    const keyRootIndex = NOTES.indexOf(normalizeNote(keyRoot));

    // bVI (borrowed from minor)
    const flatSix = NOTES[(keyRootIndex + 8) % 12];
    if (chordRoot === flatSix && chordQuality.includes('major')) {
      return {
        type: 'modal_interchange',
        function: '♭VI - Borrowed from parallel minor',
        romanNumeral: '♭VI',
        borrowed_from: 'parallel minor'
      };
    }

    // bVII (borrowed from minor)
    const flatSeven = NOTES[(keyRootIndex + 10) % 12];
    if (chordRoot === flatSeven && chordQuality.includes('major')) {
      return {
        type: 'modal_interchange',
        function: '♭VII - Borrowed from parallel minor',
        romanNumeral: '♭VII',
        borrowed_from: 'parallel minor'
      };
    }

    // iv (borrowed from minor)
    const four = scaleNotes[3];
    if (normalizeNote(four) === chordRoot && chordQuality.includes('minor')) {
      return {
        type: 'modal_interchange',
        function: 'iv - Borrowed from parallel minor',
        romanNumeral: 'iv',
        borrowed_from: 'parallel minor'
      };
    }
  }

  return null;
}

/**
 * Detect tritone substitution
 */
function detectTritoneSubstitution(chord, next, keyRoot, scaleNotes) {
  if (!next || !next.parsed) return null;

  const chordRoot = normalizeNote(chord.parsed.root);
  const targetRoot = normalizeNote(next.parsed.root);
  const interval = getInterval(chordRoot, targetRoot);

  // Tritone sub resolves down a half step
  if (interval === 1 || interval === 11) {
    return {
      type: 'tritone_substitution',
      function: 'subV7 - Tritone substitution',
      romanNumeral: 'subV7',
      resolves_to: next.original
    };
  }

  return null;
}

/**
 * Detect passing diminished chord
 */
function detectPassingChord(chord, previous, next, scaleNotes) {
  if (!previous || !next) return null;

  const chordRoot = normalizeNote(chord.parsed.root);
  const prevRoot = normalizeNote(previous.parsed.root);
  const nextRoot = normalizeNote(next.parsed.root);

  const prevInterval = getInterval(prevRoot, chordRoot);
  const nextInterval = getInterval(chordRoot, nextRoot);

  // Passing chord moves chromatically
  if ((prevInterval === 1 && nextInterval === 1) ||
      (prevInterval === 11 && nextInterval === 11)) {
    return {
      type: 'passing_chord',
      function: 'Passing diminished - chromatic voice leading',
      romanNumeral: '♯vii° or ♭ii°'
    };
  }

  return null;
}

/**
 * Get harmonic function of diatonic chord
 */
function getHarmonicFunction(degree, quality, scaleName) {
  // Tonic function
  if ([1, 3, 6].includes(degree)) {
    if (degree === 1) return 'Tonic - Home base';
    if (degree === 3) return 'Tonic substitute (mediant)';
    if (degree === 6) return 'Tonic substitute (submediant)';
  }

  // Dominant function
  if ([5, 7].includes(degree)) {
    if (degree === 5) {
      if (quality.toLowerCase().includes('7')) {
        return 'Dominant - Strong pull to tonic';
      }
      return 'Dominant';
    }
    if (degree === 7) return 'Dominant substitute (leading tone)';
  }

  // Subdominant function
  if ([2, 4].includes(degree)) {
    if (degree === 4) return 'Subdominant - Pre-dominant';
    if (degree === 2) return 'Subdominant substitute (supertonic)';
  }

  return 'Other';
}

function checkQualityMatch(actualQuality, degree, scaleName) {
  let expectedQualities = null;

  if (scaleName === 'major' || scaleName === 'ionian') {
    expectedQualities = EXPECTED_QUALITIES['major'][degree];
  } else if (scaleName === 'natural_minor' || scaleName === 'aeolian') {
    expectedQualities = EXPECTED_QUALITIES['natural_minor'][degree];
  } else if (scaleName === 'harmonic_minor') {
    expectedQualities = EXPECTED_QUALITIES['harmonic_minor'][degree];
  } else {
    return true;
  }

  if (!expectedQualities) return false;

  const normalized = actualQuality.toLowerCase();

  for (const expected of expectedQualities) {
    if (normalized.includes(expected.toLowerCase())) {
      return true;
    }

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

function calculateConfidence(params) {
  const {
    diatonicPercentage,
    functionalPercentage,
    scaleName,
    progressionPattern,
    hasCadence,
    hasTonicResolution,
    chordAnalyses
  } = params;

  let score = 0;

  // Functional percentage (diatonic + functional chromatic) - 50 points
  score += (functionalPercentage / 100) * 50;

  // Diatonic percentage - 20 points
  score += (diatonicPercentage / 100) * 20;

  // Scale priority - 15 points
  const priority = SCALE_PRIORITY[scaleName] || 4;
  if (priority === 1) score += 15;
  else if (priority === 2) score += 10;
  else if (priority === 3) score += 7;
  else score += 3;

  // Common progression pattern - 10 points
  if (progressionPattern) score += 10;

  // Cadence - 5 points
  if (hasCadence) score += 5;

  // Tonic present - 5 points
  if (hasTonicResolution) score += 5;

  // Bonus for 100% functional
  if (functionalPercentage === 100) score += 10;

  return Math.min(100, score);
}

function detectProgressionPattern(analysis) {
  if (analysis.length < 2) return null;

  const degrees = analysis.map(a => a.degree).filter(d => d !== null);
  const pattern = degrees.join('-');

  // Common patterns
  if (pattern.includes('1-5-6-4')) return 'I-V-vi-IV (Pop/Rock progression)';
  if (pattern.includes('6-4-1-5')) return 'vi-IV-I-V (Pop progression variant)';
  if (pattern.includes('1-6-4-5')) return 'I-vi-IV-V (50s progression)';
  if (pattern.includes('1-4-5')) return 'I-IV-V (Blues/Rock)';

  // Jazz patterns
  for (let i = 0; i <= degrees.length - 3; i++) {
    if (degrees[i] === 2 && degrees[i + 1] === 5 && degrees[i + 2] === 1) {
      return 'ii-V-I (Jazz turnaround)';
    }
  }

  // Check for secondary dominant chains
  const hasSecondaryDominants = analysis.some(a =>
    a.chromaticFunction?.type === 'secondary_dominant'
  );

  if (hasSecondaryDominants) {
    return 'Contains secondary dominants (functional chromaticism)';
  }

  return null;
}

function detectCadence(analysis) {
  if (analysis.length < 2) return false;

  const lastTwo = analysis.slice(-2);

  // V-I or V7-I
  const firstFunc = lastTwo[0].chromaticFunction?.type;
  if ((lastTwo[0].degree === 5 || firstFunc === 'secondary_dominant') &&
      lastTwo[1].degree === 1) {
    return true;
  }

  // IV-I
  if (lastTwo[0].degree === 4 && lastTwo[1].degree === 1) {
    return true;
  }

  return false;
}

function toRomanNumeral(degree, quality) {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  let numeral = numerals[degree - 1] || '?';

  const normalized = quality.toLowerCase();

  if (normalized.includes('minor') || normalized.includes('m7') || normalized.includes('m9')) {
    numeral = numeral.toLowerCase();
  } else if (normalized.includes('diminished') || normalized.includes('dim')) {
    numeral = numeral.toLowerCase() + '°';
  } else if (normalized.includes('augmented') || normalized.includes('aug')) {
    numeral = numeral + '+';
  }

  return numeral;
}

function getRomanNumeral(degree) {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  return numerals[degree - 1] || '?';
}

function getInterval(fromNote, toNote) {
  const fromIndex = NOTES.indexOf(fromNote);
  const toIndex = NOTES.indexOf(toNote);
  return (toIndex - fromIndex + 12) % 12;
}

function normalizeNote(note) {
  const map = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  return map[note] || note;
}

export function isAtonal(possibilities) {
  if (possibilities.length === 0) return true;
  const bestMatch = possibilities[0];
  return bestMatch.confidence < 60 && bestMatch.fitness.functionalPercentage < 100;
}

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
