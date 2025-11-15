import { NOTES, SCALES, CHORD_QUALITIES, APPROACH_STRATEGIES, STYLE_REFERENCES } from './musicData.js';
import { getChordNotes } from './chordParser.js';

/**
 * Analyzes harmonic context and recommends scales/arpeggios for each chord
 * Takes into account what came before and after
 */
export function analyzeHarmonicContext(chordProgression, keyInfo) {
  if (!chordProgression || chordProgression.length === 0) {
    return [];
  }

  return chordProgression.map((chord, index) => {
    const previous = index > 0 ? chordProgression[index - 1] : null;
    const next = index < chordProgression.length - 1 ? chordProgression[index + 1] : null;

    const analysis = {
      chord: chord.original,
      chordData: chord.parsed,
      position: { index, total: chordProgression.length },
      context: {
        previous: previous?.original || null,
        next: next?.original || null
      }
    };

    // Get recommended scales based on chord quality and context
    analysis.recommendedScales = getRecommendedScales(chord, keyInfo, previous, next);

    // Get arpeggio recommendations
    analysis.arpeggios = getArpeggioRecommendations(chord, keyInfo);

    // Get approach note suggestions
    analysis.approachNotes = getApproachNotes(chord, previous, next, keyInfo);

    // Get voice leading suggestions
    analysis.voiceLeading = getVoiceLeadingSuggestions(chord, previous, next);

    // Get lick ideas and note choices
    analysis.lickIdeas = getLickIdeas(chord, keyInfo, previous, next);

    // Get insights and explanations
    analysis.insights = getInsights(chord, keyInfo, previous, next);

    return analysis;
  });
}

/**
 * Get recommended scales for a chord based on its function and context
 */
function getRecommendedScales(chord, keyInfo, previous, next) {
  if (!chord.parsed) return [];

  const recommendations = [];
  const quality = chord.parsed.quality.toLowerCase();
  const root = chord.parsed.root;

  // Determine if this chord is in the key or chromatic
  let isInKey = false;
  let scaleDegree = null;

  if (keyInfo && keyInfo.analysis && keyInfo.analysis.chords) {
    const chordAnalysis = keyInfo.analysis.chords.find(c => c.chord === chord.original);
    if (chordAnalysis && !chordAnalysis.isChromatic) {
      isInKey = true;
      scaleDegree = chordAnalysis.degree;
    }
  }

  // Major chord recommendations
  if (quality.includes('major') && !quality.includes('7')) {
    recommendations.push(
      { scale: 'major', root, priority: 'high', reason: 'Parent major scale' },
      { scale: 'major_pentatonic', root, priority: 'high', reason: 'Consonant pentatonic sound' },
      { scale: 'lydian', root, priority: 'medium', reason: 'Bright, modern sound' },
      { scale: 'mixolydian', root, priority: 'medium', reason: 'Blues/rock flavor' }
    );
  }

  // Minor chord recommendations
  else if (quality.includes('minor') && !quality.includes('7')) {
    recommendations.push(
      { scale: 'natural_minor', root, priority: 'high', reason: 'Parent natural minor scale' },
      { scale: 'minor_pentatonic', root, priority: 'high', reason: 'Classic minor sound' },
      { scale: 'dorian', root, priority: 'high', reason: 'Jazz/funk flavor' },
      { scale: 'phrygian', root, priority: 'medium', reason: 'Spanish/exotic sound' }
    );
  }

  // Dominant 7th chords
  else if (quality.includes('7') && !quality.includes('maj') && !quality.includes('minor')) {
    recommendations.push(
      { scale: 'mixolydian', root, priority: 'high', reason: 'Standard dominant scale' },
      { scale: 'bebop_dominant', root, priority: 'high', reason: 'Jazz/bebop lines' },
      { scale: 'lydian_dominant', root, priority: 'medium', reason: 'Modern jazz sound (#11)' },
      { scale: 'altered', root, priority: 'medium', reason: 'Outside/altered sound' },
      { scale: 'whole_tone', root, priority: 'medium', reason: 'Suspended, ambiguous' },
      { scale: 'diminished_whole_half', root, priority: 'medium', reason: 'Diminished tension' }
    );

    // If resolving to tonic (V-I), emphasize resolution
    if (next && scaleDegree === 5) {
      recommendations[0].reason += ' - resolving to tonic';
      recommendations[0].priority = 'very_high';
    }
  }

  // Major 7th chords
  else if (quality.includes('maj7')) {
    recommendations.push(
      { scale: 'major', root, priority: 'high', reason: 'Pure major sound' },
      { scale: 'lydian', root, priority: 'high', reason: 'Bright major sound' },
      { scale: 'ionian', root, priority: 'medium', reason: 'Traditional major' }
    );

    if (quality.includes('#11')) {
      recommendations[0] = { scale: 'lydian', root, priority: 'very_high', reason: 'Perfect for #11 extension' };
    }
  }

  // Minor 7th chords
  else if (quality.includes('m7') || quality.includes('min7')) {
    recommendations.push(
      { scale: 'dorian', root, priority: 'high', reason: 'Jazz standard for min7' },
      { scale: 'natural_minor', root, priority: 'high', reason: 'Aeolian mode' },
      { scale: 'melodic_minor', root, priority: 'medium', reason: 'Modern jazz sound' },
      { scale: 'bebop_minor', root, priority: 'medium', reason: 'Bebop lines' }
    );

    // Check function in key
    if (scaleDegree === 2) {
      recommendations[0].reason += ' - ii chord in major';
    } else if (scaleDegree === 3) {
      recommendations[0] = { scale: 'phrygian', root, priority: 'high', reason: 'iii chord in major' };
    }
  }

  // Half-diminished (m7b5)
  else if (quality.includes('m7b5') || quality.includes('half_diminished')) {
    recommendations.push(
      { scale: 'locrian', root, priority: 'high', reason: 'Standard for half-diminished' },
      { scale: 'locrian_natural_2', root, priority: 'medium', reason: 'Melodic minor mode' }
    );
  }

  // Diminished 7th
  else if (quality.includes('dim7')) {
    recommendations.push(
      { scale: 'diminished_whole_half', root, priority: 'high', reason: 'Symmetrical diminished' },
      { scale: 'diminished_half_whole', root, priority: 'high', reason: 'Dominant diminished' }
    );
  }

  // Augmented
  else if (quality.includes('aug')) {
    recommendations.push(
      { scale: 'whole_tone', root, priority: 'high', reason: 'Whole tone symmetry' },
      { scale: 'augmented', root, priority: 'medium', reason: 'Augmented hexatonic' }
    );
  }

  // Altered chords (7alt, 7#5, 7b9, etc.)
  if (quality.includes('b9') || quality.includes('#9') || quality.includes('b5') || quality.includes('#5') || quality.includes('alt')) {
    recommendations.unshift(
      { scale: 'altered', root, priority: 'very_high', reason: 'Perfect for altered dominants' }
    );
  }

  // If using key context, add the key scale
  if (keyInfo && isInKey) {
    recommendations.push({
      scale: keyInfo.scale,
      root: keyInfo.root,
      priority: 'context',
      reason: `Diatonic to ${keyInfo.root} ${keyInfo.scale}`
    });
  }

  return recommendations;
}

/**
 * Get arpeggio recommendations
 */
function getArpeggioRecommendations(chord, keyInfo) {
  if (!chord.parsed || !chord.notes) return [];

  const arpeggios = [];

  // Basic chord arpeggio
  arpeggios.push({
    name: `${chord.original} arpeggio`,
    notes: chord.notes,
    priority: 'essential',
    usage: 'Outline the chord tones'
  });

  // Add upper structure triads for extended chords
  if (chord.parsed.quality.includes('9') || chord.parsed.quality.includes('11') || chord.parsed.quality.includes('13')) {
    arpeggios.push({
      name: 'Upper structure triad',
      priority: 'high',
      usage: 'Target extensions (9th, 11th, 13th)'
    });
  }

  // Add related arpeggios based on quality
  const quality = chord.parsed.quality.toLowerCase();

  if (quality.includes('7') && !quality.includes('maj7')) {
    // Dominant chord - can use diminished arpeggio from 3rd
    arpeggios.push({
      name: 'Diminished arpeggio from 3rd',
      priority: 'medium',
      usage: 'Creates tension over dominant chords'
    });
  }

  return arpeggios;
}

/**
 * Get approach note suggestions to target chord tones
 */
function getApproachNotes(chord, previous, next, keyInfo) {
  if (!chord.notes || chord.notes.length === 0) return [];

  const suggestions = [];
  const targetNotes = chord.notes;

  // Chromatic approach from below
  suggestions.push({
    strategy: 'Chromatic approach from below',
    description: 'Approach chord tones from a half-step below',
    example: `Target ${targetNotes[0]}, approach from ${getHalfStepBelow(targetNotes[0])}`,
    usage: 'Strong, direct approach - works in any context',
    artists: ['Charlie Parker', 'Wes Montgomery']
  });

  // Chromatic approach from above
  suggestions.push({
    strategy: 'Chromatic approach from above',
    description: 'Approach chord tones from a half-step above',
    example: `Target ${targetNotes[0]}, approach from ${getHalfStepAbove(targetNotes[0])}`,
    usage: 'Creates downward tension',
    artists: ['Joe Pass']
  });

  // Diatonic approach
  if (keyInfo) {
    suggestions.push({
      strategy: 'Diatonic approach',
      description: 'Approach from scale tones',
      usage: 'Smooth, inside sound',
      artists: ['Jim Hall']
    });
  }

  // Double chromatic (enclosure)
  suggestions.push({
    strategy: 'Enclosure',
    description: 'Surround target note from above and below',
    example: `Target ${targetNotes[0]}: play ${getHalfStepAbove(targetNotes[0])} → ${getHalfStepBelow(targetNotes[0])} → ${targetNotes[0]}`,
    usage: 'Bebop classic - creates strong resolution',
    artists: ['Charlie Parker', 'Pat Martino']
  });

  return suggestions;
}

/**
 * Get voice leading suggestions
 */
function getVoiceLeadingSuggestions(chord, previous, next) {
  const suggestions = [];

  if (previous && previous.notes && chord.notes) {
    // Find common tones
    const commonTones = chord.notes.filter(note =>
      previous.notes.some(pNote => normalizeNote(pNote) === normalizeNote(note))
    );

    if (commonTones.length > 0) {
      suggestions.push({
        type: 'Common tone',
        notes: commonTones,
        description: `Hold ${commonTones.join(', ')} from previous chord`,
        reason: 'Smooth voice leading through common tones'
      });
    }

    // Find stepwise motion opportunities
    const halfStepMoves = findHalfStepMoves(previous.notes, chord.notes);
    if (halfStepMoves.length > 0) {
      suggestions.push({
        type: 'Half-step motion',
        moves: halfStepMoves,
        description: 'Strong chromatic voice leading',
        reason: 'Creates smooth, connected lines'
      });
    }
  }

  if (next && next.notes && chord.notes) {
    suggestions.push({
      type: 'Prepare next chord',
      description: 'End phrases on notes that lead smoothly to next chord',
      reason: 'Sets up the next change'
    });
  }

  return suggestions;
}

/**
 * Get lick ideas and note choice explanations
 */
function getLickIdeas(chord, keyInfo, previous, next) {
  const ideas = [];
  const quality = chord.parsed?.quality?.toLowerCase() || '';

  // Bebop approach
  if (quality.includes('7')) {
    ideas.push({
      style: 'Bebop',
      description: 'Use bebop scale with chromatic passing tones',
      example: 'Start on chord tone → scale tone → chromatic passing tone → chord tone',
      references: STYLE_REFERENCES.bebop,
      noteChoices: 'Target chord tones on strong beats, chromatic notes on weak beats'
    });
  }

  // Blues approach
  if (quality.includes('7') || quality.includes('minor')) {
    ideas.push({
      style: 'Blues',
      description: 'Mix major and minor thirds, use bends',
      example: 'Blues scale with emphasis on b3 → 3 tension',
      references: STYLE_REFERENCES.blues,
      noteChoices: 'Blue notes (b3, b5, b7) create tension and release'
    });
  }

  // Triad pairs
  ideas.push({
    style: 'Modern Jazz',
    description: 'Combine two triads to create tension',
    example: 'Over C7: alternate between C major and D major triads',
    noteChoices: 'Upper structure triads highlight extensions'
  });

  // Intervallic approach
  ideas.push({
    style: 'Contemporary',
    description: 'Use wide intervals (4ths, 5ths, 6ths)',
    example: 'Quartal harmony, stacked 4ths',
    references: { artists: ['John Scofield', 'Kurt Rosenwinkel'] },
    noteChoices: 'Intervals create modern, open sound'
  });

  return ideas;
}

/**
 * Get detailed insights and explanations
 */
function getInsights(chord, keyInfo, previous, next) {
  const insights = [];

  // Key relationship
  if (keyInfo && keyInfo.analysis && keyInfo.analysis.chords) {
    const chordAnalysis = keyInfo.analysis.chords.find(c => c.chord === chord.original);
    if (chordAnalysis) {
      if (!chordAnalysis.isChromatic) {
        insights.push({
          category: 'Harmonic Function',
          text: `This is the ${chordAnalysis.romanNumeral} chord in ${keyInfo.root} ${keyInfo.scale}, functioning as ${chordAnalysis.function}`
        });
      } else {
        insights.push({
          category: 'Chromatic Element',
          text: 'This chord is outside the key - creates color and tension'
        });
      }
    }
  }

  // Tension and resolution
  if (chord.parsed?.quality?.includes('7')) {
    insights.push({
      category: 'Tension',
      text: 'The 7th creates dissonance that wants to resolve'
    });
  }

  // Extensions
  if (chord.parsed?.extensions && chord.parsed.extensions.length > 0) {
    insights.push({
      category: 'Extensions',
      text: 'Extended notes (9th, 11th, 13th) add color - emphasize these in your lines'
    });
  }

  // Alterations
  if (chord.parsed?.alterations && chord.parsed.alterations.length > 0) {
    insights.push({
      category: 'Alterations',
      text: `Altered notes (${chord.parsed.alterations.map(a => a.accidental + a.degree).join(', ')}) create tension - use altered scales`
    });
  }

  return insights;
}

// Helper functions
function normalizeNote(note) {
  const map = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  return map[note] || note;
}

function getHalfStepBelow(note) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const index = notes.indexOf(normalizeNote(note));
  return notes[(index - 1 + 12) % 12];
}

function getHalfStepAbove(note) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const index = notes.indexOf(normalizeNote(note));
  return notes[(index + 1) % 12];
}

function findHalfStepMoves(fromNotes, toNotes) {
  const moves = [];
  fromNotes.forEach(fromNote => {
    toNotes.forEach(toNote => {
      const fromIndex = NOTES.indexOf(normalizeNote(fromNote));
      const toIndex = NOTES.indexOf(normalizeNote(toNote));
      const distance = Math.abs(toIndex - fromIndex);
      if (distance === 1 || distance === 11) {
        moves.push({ from: fromNote, to: toNote });
      }
    });
  });
  return moves;
}
