<script>
  import { NOTES, GUITAR_TUNING } from '../musicData.js';

  export let highlightNotes = [];
  export let scale = null;
  export let compact = false;

  const numFrets = compact ? 12 : 15;

  function getNoteAtFret(string, fret) {
    const openNote = GUITAR_TUNING[GUITAR_TUNING.length - string].note;
    const noteIndex = NOTES.indexOf(openNote);
    const actualNoteIndex = (noteIndex + fret) % 12;
    return NOTES[actualNoteIndex];
  }

  function shouldHighlight(note) {
    if (!highlightNotes || highlightNotes.length === 0) return false;
    const normalizedNote = normalizeNote(note);
    return highlightNotes.some(hn => normalizeNote(hn) === normalizedNote);
  }

  function isRoot(note) {
    if (!highlightNotes || highlightNotes.length === 0) return false;
    const normalizedNote = normalizeNote(note);
    const rootNote = normalizeNote(highlightNotes[0]);
    return normalizedNote === rootNote;
  }

  function normalizeNote(note) {
    const map = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    return map[note] || note;
  }

  function isMarkerFret(fret) {
    return [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fret);
  }

  function isDoubleMarker(fret) {
    return [12, 24].includes(fret);
  }
</script>

<div class="fretboard-container">
  {#if scale}
    <div class="scale-info mb-2 text-sm text-gray-300">
      {scale}
    </div>
  {/if}

  <div class="fretboard">
    <!-- Fret markers -->
    <div class="fret-markers">
      {#each Array(numFrets + 1) as _, fret}
        <div class="fret-marker">
          {#if isDoubleMarker(fret)}
            <div class="marker double"></div>
          {:else if isMarkerFret(fret)}
            <div class="marker single"></div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Strings -->
    <div class="strings">
      {#each [1, 2, 3, 4, 5, 6] as string}
        <div class="string">
          {#each Array(numFrets + 1) as _, fret}
            {@const note = getNoteAtFret(string, fret)}
            {@const highlighted = shouldHighlight(note)}
            {@const root = isRoot(note)}

            <div class="fret" class:fret-0={fret === 0}>
              {#if highlighted}
                <div class="note" class:root={root}>
                  {note}
                </div>
              {/if}
              {#if fret < numFrets}
                <div class="fret-line"></div>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>

    <!-- Fret numbers -->
    <div class="fret-numbers">
      {#each Array(numFrets + 1) as _, fret}
        <div class="fret-number">
          {#if fret > 0 && fret % 2 === 1}
            <span>{fret}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .fretboard-container {
    width: 100%;
    overflow-x: auto;
    background: #1a1a2e;
    padding: 1rem;
    border-radius: 0.5rem;
  }

  .scale-info {
    text-align: center;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .fretboard {
    position: relative;
    min-width: 800px;
  }

  .fret-markers {
    display: flex;
    margin-bottom: 0.5rem;
    justify-content: space-between;
  }

  .fret-marker {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 1.5rem;
  }

  .marker {
    width: 8px;
    height: 8px;
    background: #444;
    border-radius: 50%;
  }

  .marker.double {
    box-shadow: -6px 0 0 #444, 6px 0 0 #444;
  }

  .strings {
    position: relative;
  }

  .string {
    display: flex;
    position: relative;
    height: 2.5rem;
    margin-bottom: 0.25rem;
  }

  .string::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 2px;
    background: linear-gradient(to bottom, #888, #666);
    z-index: 0;
  }

  .string:nth-child(1)::before { height: 1px; }
  .string:nth-child(2)::before { height: 1.5px; }
  .string:nth-child(3)::before { height: 1.5px; }
  .string:nth-child(4)::before { height: 2px; }
  .string:nth-child(5)::before { height: 2.5px; }
  .string:nth-child(6)::before { height: 3px; }

  .fret {
    flex: 1;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .fret-0 {
    flex: 0.5;
  }

  .fret-line {
    position: absolute;
    right: 0;
    top: -0.5rem;
    bottom: -0.5rem;
    width: 3px;
    background: linear-gradient(to right, #999, #bbb, #999);
    z-index: 1;
  }

  .note {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: #e94560;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.7rem;
    font-weight: 600;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .note.root {
    background: #ffd700;
    color: #1a1a2e;
    border: 2px solid #ffed4e;
    font-weight: 700;
  }

  .fret-numbers {
    display: flex;
    margin-top: 0.5rem;
    justify-content: space-between;
  }

  .fret-number {
    flex: 1;
    text-align: center;
    font-size: 0.75rem;
    color: #888;
  }

  .fret-number:first-child {
    flex: 0.5;
  }
</style>
