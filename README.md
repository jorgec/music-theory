# Music Theory Analyzer

An intelligent music theory analysis app for 6-string guitar chord progressions.

## Features

- Comprehensive chord notation parsing (extended chords, alterations, slash chords)
- Exhaustive key/tonic detection across major/minor modes, jazz scales, bebop scales, exotic scales
- Harmonic function analysis with contextual awareness
- Scale, arpeggio, and lick suggestions for each chord
- Approach notes and voice leading recommendations
- Guitar fretboard visualization
- Detailed note choice analysis and insights

## 12-Factor App Principles

This app follows the 12-factor methodology:
- **Dependencies**: Explicitly declared in package.json
- **Config**: Environment variables for port configuration
- **Build/Run**: Separate build and run stages
- **Stateless**: All data derived from input, no persistent state
- **Logs**: Console logging to stdout
- **Dev/Prod parity**: Same build process for all environments

## Quick Start

### Using Bash Scripts (Recommended)

```bash
# Install dependencies
./install.sh

# Start development server
./dev.sh
```

### Using npm Directly

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. Enter a chord progression in the input field (e.g., `Em A7 Dmaj7 Gmaj7`)
2. Click "Analyze" or press Enter
3. View:
   - Possible keys with confidence scores
   - Roman numeral analysis
   - Chord-by-chord recommendations
   - Scale suggestions with guitar fretboard visualization
   - Approach notes and voice leading tips
   - Lick ideas with artist references

## Supported Chord Notations

- **Basic triads**: C, Dm, E, etc.
- **7th chords**: Cmaj7, Dm7, G7, etc.
- **Extended chords**: C9, Dm11, G13, etc.
- **Altered chords**: G7b9, C7#11, D7alt, etc.
- **Slash chords**: C/E, Dm7/G, etc.
- **Complex**: Cmaj7#11, G13b9, Am7b5, etc.
