import { parseProgression } from './src/lib/chordParser.js';
import { detectKeys, isAtonal, describeKey } from './src/lib/keyDetection.js';

const testCases = [
  {
    name: 'ii-V-I in C Major',
    progression: 'Dm7 G7 Cmaj7',
    expectedKey: 'C',
    expectedPattern: 'ii-V-I'
  },
  {
    name: 'Rhythm Changes (A section)',
    progression: 'Cmaj7 Am7 Dm7 G7 Em7 A7 Dm7 G7',
    expectedKey: 'C',
    expectedPattern: null
  },
  {
    name: 'Descending ii-V-I',
    progression: 'Cmaj7 Cmaj7 Cm7 F7',  // % becomes repeated chord
    expectedKey: 'Multiple',
    expectedPattern: null
  },
  {
    name: 'Diminished Passing Chords',
    progression: 'Cmaj7 C#dim7 Dm7 D#dim7 Em7 A7',
    expectedKey: 'C',
    expectedPattern: null
  },
  {
    name: 'I to IV',
    progression: 'Cmaj7 Gm7 C7 Fmaj7',
    expectedKey: 'C or F',
    expectedPattern: null
  },
  {
    name: 'IV to iv (Modal Interchange)',
    progression: 'Cmaj7 C7 Fmaj7 Fm7',
    expectedKey: 'C',
    expectedPattern: null
  },
  {
    name: '12-Bar Blues in C',
    progression: 'C7 C7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7',
    expectedKey: 'C',
    expectedPattern: null
  }
];

console.log('MUSIC THEORY ANALYZER - TEST SUITE');
console.log('=' .repeat(80));

testCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log('-'.repeat(80));
  console.log(`Input: ${test.progression}`);

  const chords = parseProgression(test.progression);
  console.log(`Parsed: ${chords.length} chords`);

  const keys = detectKeys(chords);

  if (keys.length === 0) {
    console.log('❌ FAILED: No keys detected (marked as atonal)');
    return;
  }

  console.log(`\nDetected ${keys.length} possible key(s):`);

  // Show top 3
  keys.slice(0, 3).forEach((key, i) => {
    const prefix = i === 0 ? '  🎯' : '    ';
    console.log(`${prefix} ${describeKey(key)} - ${key.confidence.toFixed(0)}% confidence`);
    console.log(`      Functional: ${key.fitness.functionalPercentage.toFixed(0)}% | Diatonic: ${key.fitness.diatonicPercentage.toFixed(0)}%`);

    if (key.analysis.pattern) {
      console.log(`      Pattern: ${key.analysis.pattern}`);
    }

    // Show chord analysis
    const romanNumerals = key.analysis.chords.map(c => c.romanNumeral).join(' - ');
    console.log(`      Analysis: ${romanNumerals}`);

    // Show any chromatic functions
    const chromaticChords = key.analysis.chords.filter(c => c.chromaticFunction);
    if (chromaticChords.length > 0) {
      console.log(`      Chromatic:`);
      chromaticChords.forEach(c => {
        console.log(`        ${c.chord}: ${c.chromaticFunction.function}`);
      });
    }
  });

  // Check if expected key is in top result
  if (test.expectedKey !== 'Multiple' && test.expectedKey !== 'C or F') {
    const topKey = keys[0];
    if (topKey.root === test.expectedKey) {
      console.log(`\n  ✅ PASS: Correctly detected ${test.expectedKey}`);
    } else {
      console.log(`\n  ⚠️  WARNING: Expected ${test.expectedKey}, got ${topKey.root}`);
    }
  }

  if (test.expectedPattern) {
    const topKey = keys[0];
    if (topKey.analysis.pattern && topKey.analysis.pattern.includes(test.expectedPattern)) {
      console.log(`  ✅ PASS: Correctly detected pattern "${test.expectedPattern}"`);
    } else {
      console.log(`  ⚠️  WARNING: Expected pattern "${test.expectedPattern}", got "${topKey.analysis.pattern || 'none'}"`);
    }
  }
});

console.log('\n' + '='.repeat(80));
console.log('TEST SUITE COMPLETE\n');
