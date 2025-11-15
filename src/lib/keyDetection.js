import { NOTES, FLAT_NOTES, SCALES, CHORD_QUALITIES } from './musicData.js';
import { getChordNotes } from './chordParser.js';

/**
 * Detects possible keys/tonics for a chord progression
 * Exhaustively checks all major modes, minor modes, jazz scales, bebop scales, and exotic scales
 */
export function detectKeys(chordProgression) {
  if (!chordProgression || chordProgression.length === 0) {
    return [];
  }

  // Collect all unique notes from all chords
  const allNotes = new Set();
  chordProgression.forEach(chord => {
    if (chord.notes) {
      chord.notes.forEach(note => allNotes.add(normalizeNote(note)));
    }
  });

  const noteArray = Array.from(allNotes);

  // Test every root and every scale
  const possibilities = [];

  for (const root of NOTES) {
    for (const [scaleName, intervals] of Object.entries(SCALES)) {
      const scaleNotes = intervals.map(interval => {
        const noteIndex = (NOTES.indexOf(root) + interval) % 12;
        return NOTES[noteIndex];
      });

      // Check if all chord notes fit in this scale
      const fitness = calculateScaleFitness(noteArray, scaleNotes);

      if (fitness.matchPercentage >= 70) { // At least 70% match
        // Analyze the progression to determine which scale degree each chord is
        const analysis = analyzeProgressionInKey(chordProgression, root, scaleName, scaleNotes);

        possibilities.push({
          root,
          scale: scaleName,
          scaleNotes,
          fitness,
          analysis,
          confidence: calculateConfidence(fitness, analysis)
        });
      }
    }
  }

  // Sort by confidence
  possibilities.sort((a, b) => b.confidence - a.confidence);

  return possibilities;
}

/**
 * Normalize note name (convert flats to sharps for comparison)
 */
function normalizeNote(note) {
  const noteMap = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  };
  return noteMap[note] || note;
}

/**
 * Calculate how well the notes fit in a scale
 */
function calculateScaleFitness(notes, scaleNotes) {
  const normalizedScale = scaleNotes.map(normalizeNote);

  let matches = 0;
  let total = notes.length;

  notes.forEach(note => {
    if (normalizedScale.includes(normalizeNote(note))) {
      matches++;
    }
  });

  return {
    matches,
    total,
    matchPercentage: (matches / total) * 100
  };
}

/**
 * Analyze the progression in the context of a specific key
 */
function analyzeProgressionInKey(progression, root, scaleName, scaleNotes) {
  const analysis = progression.map(chord => {
    if (!chord.parsed) return null;

    // Find which scale degree this chord's root is
    const chordRoot = normalizeNote(chord.parsed.root);
    const normalizedScale = scaleNotes.map(normalizeNote);
    const degreeIndex = normalizedScale.indexOf(chordRoot);

    if (degreeIndex === -1) {
      return {
        chord: chord.original,
        degree: null,
        function: 'Non-diatonic',
        isChromatic: true
      };
    }

    const degree = degreeIndex + 1; // 1-indexed
    const chordFunction = determineHarmonicFunction(degree, chord.parsed.quality);
    const expectedQuality = getExpectedQuality(scaleName, degree);
    const qualityMatch = checkQualityMatch(chord.parsed.quality, expectedQuality);

    return {
      chord: chord.original,
      degree,
      romanNumeral: toRomanNumeral(degree, chord.parsed.quality),
      function: chordFunction,
      expectedQuality,
      actualQuality: chord.parsed.quality,
      qualityMatch,
      isChromatic: false
    };
  }).filter(a => a !== null);

  // Check for common progressions
  const progressionPattern = detectProgressionPattern(analysis);

  return {
    chords: analysis,
    pattern: progressionPattern,
    hasStrongCadence: detectCadence(analysis),
    diatonicPercentage: (analysis.filter(a => !a.isChromatic).length / analysis.length) * 100
  };
}

/**
 * Determine harmonic function of a chord
 */
function determineHarmonicFunction(degree, quality) {
  // Tonic function
  if ([1, 3, 6].includes(degree)) {
    return 'Tonic';
  }

  // Dominant function
  if ([5, 7].includes(degree)) {
    if (quality.includes('7') || quality.includes('dominant')) {
      return 'Dominant (Strong)';
    }
    return 'Dominant';
  }

  // Subdominant function
  if ([2, 4].includes(degree)) {
    return 'Subdominant';
  }

  return 'Other';
}

/**
 * Get expected chord quality for a scale degree in a given scale
 */
function getExpectedQuality(scaleName, degree) {
  // Major scales and modes
  if (['major', 'ionian'].includes(scaleName)) {
    const qualities = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
    return qualities[degree - 1] || 'unknown';
  }

  if (scaleName === 'dorian') {
    const qualities = ['minor', 'minor', 'major', 'major', 'minor', 'diminished', 'major'];
    return qualities[degree - 1] || 'unknown';
  }

  if (scaleName === 'phrygian') {
    const qualities = ['minor', 'major', 'major', 'minor', 'diminished', 'major', 'minor'];
    return qualities[degree - 1] || 'unknown';
  }

  if (scaleName === 'lydian') {
    const qualities = ['major', 'major', 'minor', 'diminished', 'major', 'minor', 'minor'];
    return qualities[degree - 1] || 'unknown';
  }

  if (scaleName === 'mixolydian') {
    const qualities = ['major', 'minor', 'diminished', 'major', 'minor', 'minor', 'major'];
    return qualities[degree - 1] || 'unknown';
  }

  if (['aeolian', 'natural_minor'].includes(scaleName)) {
    const qualities = ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];
    return qualities[degree - 1] || 'unknown';
  }

  if (scaleName === 'locrian') {
    const qualities = ['diminished', 'major', 'minor', 'minor', 'major', 'major', 'minor'];
    return qualities[degree - 1] || 'unknown';
  }

  if (scaleName === 'harmonic_minor') {
    const qualities = ['minor', 'diminished', 'augmented', 'minor', 'major', 'major', 'diminished'];
    return qualities[degree - 1] || 'unknown';
  }

  if (scaleName === 'melodic_minor') {
    const qualities = ['minor', 'minor', 'augmented', 'major', 'major', 'diminished', 'diminished'];
    return qualities[degree - 1] || 'unknown';
  }

  return 'any';
}

/**
 * Check if chord quality matches expected
 */
function checkQualityMatch(actual, expected) {
  if (expected === 'any') return true;

  // Normalize qualities for comparison
  const normalizedActual = actual.toLowerCase();
  const normalizedExpected = expected.toLowerCase();

  // Extensions don't change the basic quality
  if (normalizedActual.includes(normalizedExpected)) return true;
  if (normalizedExpected === 'major' && !normalizedActual.includes('minor') && !normalizedActual.includes('dim') && !normalizedActual.includes('aug')) {
    return true;
  }

  return false;
}

/**
 * Convert scale degree to Roman numeral
 */
function toRomanNumeral(degree, quality) {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  let numeral = numerals[degree - 1] || '?';

  // Use lowercase for minor/diminished
  if (quality.includes('minor') || quality.includes('diminished')) {
    numeral = numeral.toLowerCase();
  }

  // Add symbols for alterations
  if (quality.includes('diminished')) {
    numeral += '°';
  } else if (quality.includes('augmented')) {
    numeral += '+';
  } else if (quality.includes('7')) {
    numeral += '7';
  } else if (quality.includes('9')) {
    numeral += '9';
  }

  return numeral;
}

/**
 * Detect common progression patterns
 */
function detectProgressionPattern(analysis) {
  if (analysis.length < 2) return null;

  const degrees = analysis.map(a => a.degree).filter(d => d !== null);

  // ii-V-I
  if (degrees.length >= 3) {
    for (let i = 0; i <= degrees.length - 3; i++) {
      if (degrees[i] === 2 && degrees[i + 1] === 5 && degrees[i + 2] === 1) {
        return 'ii-V-I (Jazz Turnaround)';
      }
    }
  }

  // I-IV-V
  if (degrees.length >= 3) {
    for (let i = 0; i <= degrees.length - 3; i++) {
      if (degrees[i] === 1 && degrees[i + 1] === 4 && degrees[i + 2] === 5) {
        return 'I-IV-V (Blues/Rock)';
      }
    }
  }

  // I-V-vi-IV
  if (degrees.length >= 4) {
    for (let i = 0; i <= degrees.length - 4; i++) {
      if (degrees[i] === 1 && degrees[i + 1] === 5 && degrees[i + 2] === 6 && degrees[i + 3] === 4) {
        return 'I-V-vi-IV (Pop Progression)';
      }
    }
  }

  // i-iv-v (minor blues)
  if (degrees.length >= 3) {
    for (let i = 0; i <= degrees.length - 3; i++) {
      if (degrees[i] === 1 && degrees[i + 1] === 4 && degrees[i + 2] === 5) {
        const qualities = [analysis[i].actualQuality, analysis[i + 1].actualQuality, analysis[i + 2].actualQuality];
        if (qualities.every(q => q.includes('minor'))) {
          return 'i-iv-v (Minor Blues)';
        }
      }
    }
  }

  // Circle of fifths movement
  let hasFifthsMovement = false;
  for (let i = 0; i < degrees.length - 1; i++) {
    const interval = (degrees[i + 1] - degrees[i] + 7) % 7;
    if (interval === 4) { // Moving up a fourth (down a fifth)
      hasFifthsMovement = true;
      break;
    }
  }

  if (hasFifthsMovement) {
    return 'Circle of Fifths Movement';
  }

  return null;
}

/**
 * Detect cadences
 */
function detectCadence(analysis) {
  if (analysis.length < 2) return false;

  const lastTwo = analysis.slice(-2);

  // V-I (Perfect Cadence)
  if (lastTwo[0].degree === 5 && lastTwo[1].degree === 1) {
    return true;
  }

  // IV-I (Plagal Cadence)
  if (lastTwo[0].degree === 4 && lastTwo[1].degree === 1) {
    return true;
  }

  // ii-V or V-vi (Deceptive)
  if (lastTwo[0].degree === 2 && lastTwo[1].degree === 5) {
    return true;
  }

  return false;
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(fitness, analysis) {
  let score = 0;

  // Fitness contribution (0-50 points)
  score += (fitness.matchPercentage / 100) * 50;

  // Diatonic percentage (0-30 points)
  score += (analysis.diatonicPercentage / 100) * 30;

  // Pattern recognition (0-10 points)
  if (analysis.pattern) {
    score += 10;
  }

  // Strong cadence (0-10 points)
  if (analysis.hasStrongCadence) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Determine if progression is likely atonal
 */
export function isAtonal(possibilities) {
  if (possibilities.length === 0) return true;

  // If no key has confidence > 50, likely atonal
  const bestMatch = possibilities[0];
  return bestMatch.confidence < 50;
}

/**
 * Get human-readable key description
 */
export function describeKey(keyInfo) {
  if (!keyInfo) return 'Unknown';

  const scaleFamilies = {
    'major': 'Major',
    'ionian': 'Major (Ionian Mode)',
    'dorian': 'Dorian Mode',
    'phrygian': 'Phrygian Mode',
    'lydian': 'Lydian Mode',
    'mixolydian': 'Mixolydian Mode',
    'aeolian': 'Natural Minor (Aeolian Mode)',
    'locrian': 'Locrian Mode',
    'natural_minor': 'Natural Minor',
    'harmonic_minor': 'Harmonic Minor',
    'melodic_minor': 'Melodic Minor',
    'bebop_major': 'Bebop Major',
    'bebop_dominant': 'Bebop Dominant',
    'bebop_minor': 'Bebop Minor',
    'altered': 'Altered Scale (Super Locrian)',
    'lydian_dominant': 'Lydian Dominant',
    'whole_tone': 'Whole Tone',
    'diminished_half_whole': 'Diminished (Half-Whole)',
    'diminished_whole_half': 'Diminished (Whole-Half)'
  };

  const scaleDesc = scaleFamilies[keyInfo.scale] || keyInfo.scale.replace(/_/g, ' ');

  return `${keyInfo.root} ${scaleDesc} (${keyInfo.confidence.toFixed(1)}% confidence)`;
}
