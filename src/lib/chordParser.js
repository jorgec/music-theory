import { NOTES, FLAT_NOTES, CHORD_FORMULAS, ENHARMONICS } from './musicData.js';

/**
 * Parses a chord symbol into its components
 * Handles complex notations like Am7#11, G13b7, Cmaj7/E, etc.
 */
export function parseChord(chordSymbol) {
  if (!chordSymbol || typeof chordSymbol !== 'string') {
    return null;
  }

  const original = chordSymbol.trim();
  let remaining = original;

  // Parse root note
  const rootMatch = remaining.match(/^([A-G][b#]?)/);
  if (!rootMatch) {
    return null;
  }

  const root = rootMatch[1];
  remaining = remaining.slice(root.length);

  // Check for slash chord (bass note)
  let bassNote = null;
  const slashIndex = remaining.indexOf('/');
  if (slashIndex !== -1) {
    const bassMatch = remaining.slice(slashIndex + 1).match(/^([A-G][b#]?)/);
    if (bassMatch) {
      bassNote = bassMatch[1];
      remaining = remaining.slice(0, slashIndex);
    }
  }

  // Parse quality and extensions
  const { quality, intervals, extensions, alterations } = parseQualityAndExtensions(remaining);

  return {
    original,
    root,
    quality,
    intervals,
    extensions,
    alterations,
    bassNote
  };
}

/**
 * Parses chord quality and extensions
 */
function parseQualityAndExtensions(str) {
  let quality = 'major';
  let baseIntervals = [];
  let extensions = [];
  let alterations = [];

  // Handle power chords
  if (str === '5') {
    return {
      quality: 'power',
      intervals: CHORD_FORMULAS['5'],
      extensions: [],
      alterations: []
    };
  }

  // Detect minor (but NOT maj!)
  const isMinor = /^(min|minor|m(?!aj)|-)/i.test(str);
  if (isMinor) {
    quality = 'minor';
    str = str.replace(/^(min|minor|m(?!aj)|-)/i, '');
  }

  // Detect augmented
  if (/^(aug|\+)/i.test(str)) {
    quality = 'augmented';
    str = str.replace(/^(aug|\+)/i, '');
    baseIntervals = [...CHORD_FORMULAS['augmented']];
  }

  // Detect diminished
  else if (/^(dim|°|o)/i.test(str)) {
    quality = 'diminished';
    str = str.replace(/^(dim|°|o)/i, '');

    // Check for dim7
    if (str.startsWith('7')) {
      baseIntervals = [...CHORD_FORMULAS['dim7']];
      str = str.slice(1);
    } else {
      baseIntervals = [...CHORD_FORMULAS['diminished']];
    }
  }

  // Detect suspended
  else if (/^sus/i.test(str)) {
    str = str.replace(/^sus/i, '');
    if (str.startsWith('2')) {
      quality = 'sus2';
      baseIntervals = [...CHORD_FORMULAS['sus2']];
      str = str.slice(1);
    } else if (str.startsWith('4')) {
      quality = 'sus4';
      baseIntervals = [...CHORD_FORMULAS['sus4']];
      str = str.slice(1);
    } else {
      quality = 'sus4';
      baseIntervals = [...CHORD_FORMULAS['sus4']];
    }
  }

  // If not set yet, determine based on remaining string
  if (baseIntervals.length === 0) {
    if (quality === 'minor') {
      baseIntervals = [...CHORD_FORMULAS['minor']];
    } else {
      baseIntervals = [...CHORD_FORMULAS['major']];
    }
  }

  // Parse 7th, 9th, 11th, 13th
  const extensionMatch = str.match(/^(maj|M|Δ)?(\d+)/);
  if (extensionMatch) {
    const isMajor7 = extensionMatch[1] !== undefined;
    const extensionNum = parseInt(extensionMatch[2]);

    str = str.slice(extensionMatch[0].length);

    // Handle 7th chords
    if (extensionNum === 6) {
      quality += '6';
      baseIntervals = quality === 'minor6' ? [...CHORD_FORMULAS['m6']] : [...CHORD_FORMULAS['6']];
    } else if (extensionNum === 7) {
      if (isMajor7) {
        quality = quality === 'minor' ? 'minmaj7' : 'maj7';
        baseIntervals = quality === 'minmaj7' ? [...CHORD_FORMULAS['mmaj7']] : [...CHORD_FORMULAS['maj7']];
      } else {
        quality = quality === 'minor' ? 'min7' : quality === 'diminished' ? 'dim7' : 'dominant7';
        if (quality === 'min7') {
          baseIntervals = [...CHORD_FORMULAS['m7']];
        } else if (quality === 'dim7') {
          baseIntervals = [...CHORD_FORMULAS['dim7']];
        } else {
          baseIntervals = [...CHORD_FORMULAS['7']];
        }
      }
    } else if (extensionNum === 9) {
      extensions.push(14); // 9th is 14 semitones
      if (isMajor7 || quality === 'maj7') {
        quality = 'maj9';
        baseIntervals = [...CHORD_FORMULAS['maj7']];
      } else if (quality === 'minor') {
        quality = 'min9';
        baseIntervals = [...CHORD_FORMULAS['m7']];
      } else {
        quality = 'dominant9';
        baseIntervals = [...CHORD_FORMULAS['7']];
      }
    } else if (extensionNum === 11) {
      extensions.push(14, 17); // 9th and 11th
      if (isMajor7) {
        quality = 'maj11';
        baseIntervals = [...CHORD_FORMULAS['maj7']];
      } else if (quality === 'minor') {
        quality = 'min11';
        baseIntervals = [...CHORD_FORMULAS['m7']];
      } else {
        quality = 'dominant11';
        baseIntervals = [...CHORD_FORMULAS['7']];
      }
    } else if (extensionNum === 13) {
      extensions.push(14, 21); // 9th and 13th
      if (isMajor7) {
        quality = 'maj13';
        baseIntervals = [...CHORD_FORMULAS['maj7']];
      } else if (quality === 'minor') {
        quality = 'min13';
        baseIntervals = [...CHORD_FORMULAS['m7']];
      } else {
        quality = 'dominant13';
        baseIntervals = [...CHORD_FORMULAS['7']];
      }
    }
  }

  // Parse alterations (b5, #5, b9, #9, #11, b13, etc.)
  const alterationRegex = /([b#])(\d+)/g;
  let match;
  while ((match = alterationRegex.exec(str)) !== null) {
    const accidental = match[1];
    const degree = parseInt(match[2]);

    alterations.push({ accidental, degree });

    // Convert degree to semitones and apply alteration
    const semitones = degreeToSemitones(degree);
    const altered = accidental === 'b' ? semitones - 1 : semitones + 1;

    // Add or replace in extensions
    const original = semitones;
    const index = extensions.indexOf(original);
    const baseIndex = baseIntervals.indexOf(original);

    if (index !== -1) {
      extensions[index] = altered;
    } else if (baseIndex !== -1) {
      baseIntervals[baseIndex] = altered;
    } else {
      extensions.push(altered);
    }
  }

  // Handle "add" chords (like add9)
  const addMatch = str.match(/add(\d+)/);
  if (addMatch) {
    const addDegree = parseInt(addMatch[1]);
    const semitones = degreeToSemitones(addDegree);
    if (!extensions.includes(semitones) && !baseIntervals.includes(semitones)) {
      extensions.push(semitones);
    }
  }

  return {
    quality,
    intervals: [...baseIntervals, ...extensions].sort((a, b) => a - b),
    extensions,
    alterations
  };
}

/**
 * Convert scale degree to semitones
 */
function degreeToSemitones(degree) {
  const mapping = {
    1: 0,
    2: 2,
    3: 4,
    4: 5,
    5: 7,
    6: 9,
    7: 11,
    9: 14,
    11: 17,
    13: 21
  };
  return mapping[degree] || degree;
}

/**
 * Get actual notes in a chord
 */
export function getChordNotes(parsedChord) {
  if (!parsedChord) return [];

  const rootIndex = NOTES.indexOf(parsedChord.root);
  if (rootIndex === -1) {
    const flatRootIndex = FLAT_NOTES.indexOf(parsedChord.root);
    if (flatRootIndex === -1) return [];

    return parsedChord.intervals.map(interval => {
      const noteIndex = (flatRootIndex + interval) % 12;
      return FLAT_NOTES[noteIndex];
    });
  }

  return parsedChord.intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTES[noteIndex];
  });
}

/**
 * Normalize chord symbol for comparison
 */
export function normalizeChord(chordSymbol) {
  const parsed = parseChord(chordSymbol);
  if (!parsed) return null;

  let normalized = parsed.root;

  if (parsed.quality.includes('minor')) {
    normalized += 'm';
  } else if (parsed.quality.includes('major') && parsed.quality !== 'major') {
    normalized += 'maj';
  } else if (parsed.quality.includes('dim')) {
    normalized += 'dim';
  } else if (parsed.quality.includes('aug')) {
    normalized += 'aug';
  } else if (parsed.quality.includes('sus')) {
    normalized += 'sus';
  }

  if (parsed.quality.includes('7') || parsed.quality.includes('9') ||
      parsed.quality.includes('11') || parsed.quality.includes('13')) {
    const extMatch = parsed.quality.match(/(\d+)/);
    if (extMatch) {
      normalized += extMatch[1];
    }
  }

  parsed.alterations.forEach(alt => {
    normalized += alt.accidental + alt.degree;
  });

  if (parsed.bassNote) {
    normalized += '/' + parsed.bassNote;
  }

  return normalized;
}

/**
 * Parse multiple chords from a progression string
 */
export function parseProgression(progressionString) {
  if (!progressionString) return [];

  // Split by common delimiters
  const chordStrings = progressionString
    .split(/[,|\s]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return chordStrings.map((chordStr, index) => ({
    index,
    original: chordStr,
    parsed: parseChord(chordStr),
    notes: getChordNotes(parseChord(chordStr))
  })).filter(chord => chord.parsed !== null);
}
