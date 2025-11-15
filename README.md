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

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
