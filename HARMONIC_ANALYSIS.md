# Intelligent Harmonic Function Analysis

## Overview

This app uses a **deterministic, music theory-based algorithm** to analyze chord progressions with true intelligence. Unlike simple "does it fit the scale" approaches, it understands **harmonic function**, **chord relationships**, and **resolution patterns**.

## Core Principles

### 1. Diatonic vs. Functional

**Diatonic** = Chord is built from the scale
**Functional** = Chord serves a harmonic purpose (diatonic OR functional chromatic)

Key insight: **A progression can use chromatic chords and still be in a key**, as long as those chromatic chords serve functional purposes.

Example:
- "C Am D7 G" in C major
- D7 is chromatic (not in C major scale)
- BUT it's functional (V/V - secondary dominant to G)
- Result: 100% functional, 75% diatonic → Still in C major!

### 2. Context Matters

Every chord is analyzed with:
- **Previous chord** - Where did we come from?
- **Next chord** - Where are we going?
- **Key context** - What's the tonal center?

This allows detection of:
- Resolution patterns (V→I)
- Voice leading (chromatic motion)
- Functional relationships (secondary dominants)

## Functional Chromatic Chords

### 1. Secondary Dominants (V/x)

**Definition**: A dominant 7th chord that temporarily tonicizes a diatonic chord

**Detection**:
- Chord is a dominant 7th (not maj7)
- Resolves down a fifth (or up a fourth) to next chord
- Target chord is in the key

**Example**:
```
C  Am  D7  G   (in C major)
I  vi  V/V  V
```
- D7 is V/V (dominant of G, the V chord)
- Temporarily makes G feel like tonic
- Chromatic but functional

**Artists who use this**: Jazz musicians (Bill Evans, Miles Davis), Beatles, Steely Dan

### 2. Modal Interchange

**Definition**: Borrowing chords from the parallel major/minor key

**Common borrowed chords in major**:
- **♭VI**: Borrowed from parallel minor (e.g., Ab in C major)
- **♭VII**: Borrowed from parallel minor (e.g., Bb in C major)
- **iv**: Minor iv instead of major IV (e.g., Fm in C major)

**Example**:
```
C  F  Bb  C   (in C major)
I  IV ♭VII I
```
- Bb is borrowed from C minor
- Creates darker, bluesy color
- Still functional in C major

**Artists who use this**: Beatles ("In My Life"), Radiohead, jazz standards

### 3. Tritone Substitution (subV7)

**Definition**: Replacing V7 with a dominant chord a tritone away

**Detection**:
- Dominant 7th chord
- Resolves down a half-step

**Example**:
```
Dm7  Db7  Cmaj7   (in C major)
ii   subV7  I
```
- Db7 substitutes for G7 (tritone away)
- Both share same tritone: F-B
- Smooth chromatic bassline: D→Db→C

**Artists who use this**: Jazz (Coltrane, Herbie Hancock), modern pop

### 4. Passing Diminished Chords

**Definition**: Chromatic chords that smoothly connect diatonic chords

**Detection**:
- Diminished quality
- Located between two chords a whole step apart
- Moves chromatically

**Example**:
```
C  C#dim  Dm   (in C major)
I  #i°   ii
```
- C#dim connects C to Dm
- Pure voice leading, no harmonic weight

### 5. Chromatic Mediants

**Definition**: Chords related by a major or minor third

**Example**:
```
C  E  Am   (in C major)
I  III  vi
```
- E major (not Em) is chromatic mediant
- Common in romantic era, film music

### 6. Neapolitan Sixth (♭II)

**Definition**: Major chord built on lowered second scale degree

**Example**:
```
Dm  Db  G7  C   (in C major)
ii  ♭II  V   I
```
- Db is Neapolitan chord
- Pre-dominant function (like ii or IV)
- Resolves to dominant

## Harmonic Function Categories

### Tonic Function (Rest, Stability)
- **I** (i in minor) - Home base
- **iii** (III in minor) - Mediant
- **vi** (VI in minor) - Submediant

### Subdominant Function (Preparation, Movement Away)
- **ii** (ii° in minor) - Supertonic
- **IV** (iv in minor) - Subdominant
- **♭II** - Neapolitan (borrowed)

### Dominant Function (Tension, Pull to Tonic)
- **V** - Dominant (strongest)
- **vii°** - Leading tone
- **V/x** - Secondary dominants

## Analysis Algorithm

### Step 1: Try Diatonic Keys First

For each possible root note (C, C#, D, etc.):
1. Test major key
2. Test natural minor
3. Test harmonic minor
4. Test melodic minor

Requirement: 90%+ of chords must be functional (diatonic or functional chromatic)

### Step 2: Expand to Modes if Needed

Test: Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian

Requirement: 75%+ functional

### Step 3: Try Jazz Scales if Still No Match

Test: Bebop scales, altered scale, lydian dominant, etc.

Requirement: 70%+ functional

### Step 4: Calculate Confidence

Confidence score (0-100) based on:
- **50 points**: Functional percentage
- **20 points**: Diatonic percentage
- **15 points**: Scale priority (major/minor > modes > exotic)
- **10 points**: Recognized patterns (I-IV-V, ii-V-I, etc.)
- **5 points**: Cadence present (V-I, IV-I)
- **5 points**: Tonic chord present
- **10 points**: Bonus for 100% functional

## Examples

### Example 1: Simple Diatonic
```
Input: G Em C D

Analysis:
- G major scale: G A B C D E F#
- G: I (major) ✓
- Em: vi (minor) ✓
- C: IV (major) ✓
- D: V (major) ✓

Result:
- Key: G Major
- Confidence: 100%
- Functional: 100%
- Diatonic: 100%
- Pattern: I-vi-IV-V (Pop progression variant)
```

### Example 2: Secondary Dominant
```
Input: C Am D7 G

Analysis:
- C major scale: C D E F G A B
- C: I (major) ✓ diatonic
- Am: vi (minor) ✓ diatonic
- D7: Not in scale, BUT resolves to G (down a 5th)
  → V/V (secondary dominant)
  → FUNCTIONAL chromatic
- G: V (major) ✓ diatonic

Result:
- Key: C Major
- Confidence: 100%
- Functional: 100% (all chords serve a purpose)
- Diatonic: 75% (D7 is chromatic)
- Pattern: Contains secondary dominants
```

### Example 3: Modal Interchange
```
Input: C F Bb C

Analysis:
- C major scale: C D E F G A B
- C: I (major) ✓ diatonic
- F: IV (major) ✓ diatonic
- Bb: Not in scale, BUT is ♭VII
  → Borrowed from C minor (C D Eb F G Ab Bb)
  → Modal interchange
  → FUNCTIONAL chromatic
- C: I (major) ✓ diatonic

Result:
- Key: C Major
- Confidence: 100%
- Functional: 100%
- Diatonic: 75%
- Bb identified as: ♭VII - Borrowed from parallel minor
```

### Example 4: Jazz Progression
```
Input: Dm7 G7 Cmaj7

Analysis:
- C major scale: C D E F G A B
- Dm7: ii (minor 7th) ✓ diatonic
- G7: V (dominant 7th) ✓ diatonic
- Cmaj7: I (major 7th) ✓ diatonic

Result:
- Key: C Major
- Confidence: 100%
- Functional: 100%
- Diatonic: 100%
- Pattern: ii-V-I (Jazz turnaround)
- Cadence: Perfect (V-I)
```

### Example 5: Complex Functional Harmony
```
Input: Cmaj7 E7 Am7 D7 Dm7 G7 Cmaj7

Analysis in C major:
- Cmaj7: I ✓ diatonic
- E7: V/vi (secondary dom to Am) ✓ functional chromatic
- Am7: vi ✓ diatonic
- D7: V/V (secondary dom to G) ✓ functional chromatic
- Dm7: ii ✓ diatonic
- G7: V ✓ diatonic
- Cmaj7: I ✓ diatonic

Result:
- Key: C Major
- Confidence: 100%
- Functional: 100%
- Diatonic: 71% (E7 and D7 are chromatic)
- Pattern: Contains secondary dominants (functional chromaticism)
```

## Why This Matters

Traditional "scale matching" algorithms fail because they don't understand function:

**BAD Algorithm**: "Does every note fit in the scale?"
- "C Am D7 G" → "Nope, D7 has F#, not in C major" → WRONG

**GOOD Algorithm** (This App): "Do chords serve functional purposes?"
- "C Am D7 G" → "D7 is V/V, resolves to G" → C major, 100% functional ✓

This is how musicians actually think about harmony.

## Future Enhancements

Potential additions to make it even more intelligent:

1. **Augmented sixth chords** (It+6, Fr+6, Ger+6)
2. **Altered dominants** (7#5, 7b9, 7#9#5, etc.)
3. **Common tone diminished** (ct°7)
4. **Suspensions and retardations** (sus4, sus2)
5. **Pedal points** (static bass under changing harmony)
6. **Sequence detection** (repeating harmonic patterns)
7. **Modulation detection** (key changes mid-progression)
8. **Harmonic rhythm analysis** (pacing of chord changes)

## References

This algorithm implements concepts from:
- Walter Piston: "Harmony"
- Arnold Schoenberg: "Theory of Harmony"
- Mark Levine: "The Jazz Theory Book"
- Berklee College of Music curriculum
- Common practice period harmony (1650-1900)
- Modern jazz harmony (bebop, post-bop)

All implemented deterministically - no machine learning required!
