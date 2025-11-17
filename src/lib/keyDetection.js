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
  'harmonic_minor': 2,
  'melodic_minor': 3,
  'dorian': 4,
  'mixolydian': 4,
  'phrygian': 4,
  'lydian': 4,
  'aeolian': 4,
  'locrian': 4,
  'bebop_major': 5,
  'bebop_dominant': 5,
  'bebop_minor': 5,
  'lydian_dominant': 5,
  'altered': 5,
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
  },
  'melodic_minor': {
    1: ['minor', 'm7', 'mmaj7', 'minmaj7'],  // i or imaj7
    2: ['minor', 'm7'],                       // ii
    3: ['augmented', 'aug', 'maj7'],          // III+ or bIIImaj7
    4: ['major', '7', 'dominant7'],           // IV7
    5: ['major', '7', 'dominant7'],           // V7
    6: ['diminished', 'dim7', 'm7b5'],        // vi° or vim7b5
    7: ['diminished', 'dim7', 'm7b5']         // vii° or viim7b5
  }
};

export function detectKeys(chordProgression) {
  if (!chordProgression || chordProgression.length === 0) {
    return [];
  }

  // Check if this is a blues progression first
  const bluesKey = detectBluesProgression(chordProgression);
  if (bluesKey) {
    return [bluesKey];
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
      // FIX: functionalPercentage is in result.fitness, not result directly
      if (result && result.fitness.functionalPercentage >= 90) {
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

      // FIX: functionalPercentage is in result.fitness
      if (result && result.fitness.functionalPercentage >= 75) {
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

      // FIX: functionalPercentage is in result.fitness
      if (result && result.fitness.functionalPercentage >= 70) {
        possibilities.push(result);
      }
    }
  }

  return possibilities.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Detect blues progression - All/mostly dominant 7 chords
 * Blues uses I7-IV7-V7 but is still in a major key
 */
function detectBluesProgression(chordProgression) {
  const parsedChords = chordProgression.filter(c => c.parsed);
  if (parsedChords.length < 3) return null;

  // Count dominant 7 chords (7 but not maj7, m7, dim7, etc.)
  const dominant7Chords = parsedChords.filter(c => {
    const quality = c.parsed.quality.toLowerCase();
    // Dominant 7 chords: "7", "dominant7", "9", "11", "13" etc.
    // Exclude: "maj7", "m7", "dim7", "mmaj7", "half_diminished", etc.
    return (quality.includes('7') &&
            !quality.includes('maj') &&
            !quality.includes('m7') &&
            !quality.includes('min7') &&  // Exclude min7
            !quality.includes('minor') &&
            !quality.includes('dim') &&
            !quality.includes('half') &&
            !quality.includes('ø'));
  });

  const dominant7Percentage = (dominant7Chords.length / parsedChords.length) * 100;

  // If 75%+ of chords are dominant 7, likely blues
  if (dominant7Percentage >= 75) {
    // Find most common root - that's likely the key
    const rootCounts = {};
    parsedChords.forEach(c => {
      const root = normalizeNote(c.parsed.root);
      rootCounts[root] = (rootCounts[root] || 0) + 1;
    });

    const mostCommonRoot = Object.keys(rootCounts).reduce((a, b) =>
      rootCounts[a] > rootCounts[b] ? a : b
    );

    // Check if we have I7, IV7, V7 pattern typical of blues
    const bluesRoots = parsedChords.map(c => normalizeNote(c.parsed.root));
    const keyRootIndex = NOTES.indexOf(mostCommonRoot);
    const fourth = NOTES[(keyRootIndex + 5) % 12];
    const fifth = NOTES[(keyRootIndex + 7) % 12];

    const hasI = bluesRoots.includes(mostCommonRoot);
    const hasIV = bluesRoots.includes(fourth);
    const hasV = bluesRoots.includes(fifth);

    if (hasI && hasIV && hasV) {
      // It's a blues in major
      const scaleNotes = SCALES['major'].map(interval => {
        const noteIndex = (keyRootIndex + interval) % 12;
        return NOTES[noteIndex];
      });

      return {
        root: mostCommonRoot,
        scale: 'major',
        scaleNotes,
        analysis: {
          chords: parsedChords.map((c, i) => {
            const root = normalizeNote(c.parsed.root);
            const interval = getInterval(mostCommonRoot, root);
            let degree = null;
            let romanNumeral = '?';

            if (root === mostCommonRoot) {
              degree = 1;
              romanNumeral = 'I7';
            } else if (root === fourth) {
              degree = 4;
              romanNumeral = 'IV7';
            } else if (root === fifth) {
              degree = 5;
              romanNumeral = 'V7';
            }

            return {
              chord: c.original,
              root: c.parsed.root,
              quality: c.parsed.quality,
              degree,
              isDiatonic: true, // In blues context, these ARE diatonic
              chromaticFunction: null,
              romanNumeral,
              function: degree === 1 ? 'Tonic (Blues I7)' :
                       degree === 4 ? 'Subdominant (Blues IV7)' :
                       degree === 5 ? 'Dominant (Blues V7)' : 'Blues chord'
            };
          }),
          pattern: '12-bar blues or blues progression',
          hasStrongCadence: true,
          diatonicPercentage: 100,
          functionalPercentage: 100
        },
        confidence: 95,
        fitness: {
          diatonicPercentage: 100,
          functionalPercentage: 100,
          totalChords: parsedChords.length,
          diatonicChords: parsedChords.length,
          functionalChords: parsedChords.length
        }
      };
    }
  }

  return null;
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
  } else if (scaleName === 'melodic_minor') {
    expectedQualities = EXPECTED_QUALITIES['melodic_minor'][degree];
  } else {
    return true;
  }

  if (!expectedQualities) return false;

  const normalized = actualQuality.toLowerCase();

  for (const expected of expectedQualities) {
    if (normalized.includes(expected.toLowerCase())) {
      return true;
    }

    // Special case: plain major chord (no quality suffix or just 'major')
    if (expected === 'major' && !normalized.includes('minor') &&
        !normalized.includes('dim') && !normalized.includes('aug') &&
        (normalized === 'major' || normalized === '')) {
      return true;
    }

    // Special case: minor chord - be careful not to match 'maj'
    if (expected === 'minor' &&
        (normalized.startsWith('m') || normalized.startsWith('min')) &&
        !normalized.includes('maj')) {
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

  // Functional percentage (diatonic + functional chromatic) - 35 points
  score += (functionalPercentage / 100) * 35;

  // Diatonic percentage - 25 points
  score += (diatonicPercentage / 100) * 25;

  // BIG BONUS for 100% diatonic - prefer simple explanations (10 points)
  if (diatonicPercentage === 100) {
    score += 10;
  }

  // Scale priority - MORE WEIGHT (20 points)
  // Heavily prioritize natural major/minor over melodic minor
  const priority = SCALE_PRIORITY[scaleName] || 5;
  if (priority === 1) score += 20;      // Natural major/minor
  else if (priority === 2) score += 15; // Harmonic minor
  else if (priority === 3) score += 10; // Melodic minor
  else if (priority === 4) score += 7;  // Modes
  else if (priority === 5) score += 4;  // Jazz scales
  else score += 2;

  // Common progression pattern - STRONG WEIGHT (10 points)
  // Strong patterns like I-vi-IV-V, ii-V-I should be heavily weighted
  if (progressionPattern) {
    if (progressionPattern.includes('I-vi-IV-V') ||
        progressionPattern.includes('I-V-vi-IV') ||
        progressionPattern.includes('ii-V-I')) {
      score += 10;  // Strong, well-known patterns
    } else if (progressionPattern.includes('secondary_dominant')) {
      score += 7;   // Functional chromaticism
    } else {
      score += 5;   // Other patterns
    }
  }

  // Cadence - 5 points
  if (hasCadence) score += 5;

  // First chord is tonic - CRITICAL INDICATOR (15 points)
  // First chord being I is a VERY strong indicator of key
  const firstChordIsTonic = chordAnalyses.length > 0 && chordAnalyses[0].degree === 1;
  if (firstChordIsTonic) {
    score += 15; // VERY strong indicator - most progressions start on I
    if (hasTonicResolution) score += 5; // Even stronger
  } else if (hasTonicResolution) {
    score += 3;
  }

  // Bonus for 100% functional
  if (functionalPercentage === 100) score += 5;

  return Math.min(100, score);
}

function detectProgressionPattern(analysis) {
  if (analysis.length < 2) return null;

  const degrees = analysis.map(a => a.degree).filter(d => d !== null);
  const pattern = degrees.join('-');

  // Rhythm Changes - I-vi-ii-V or variations
  if (pattern.includes('1-6-2-5')) {
    return 'I-vi-ii-V (Rhythm Changes / Jazz standard)';
  }

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
