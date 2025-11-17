<script>
  import { NOTES, GUITAR_TUNING } from '../musicData.js';

  export let highlightNotes = [];
  export let chordTones = { all: [], root: null, third: null, fifth: null, seventh: null, ninth: null };
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

  function getChordToneType(note) {
    if (!chordTones || !chordTones.all || chordTones.all.length === 0) return null;

    const normalizedNote = normalizeNote(note);

    if (chordTones.root && normalizeNote(chordTones.root) === normalizedNote) return 'root';
    if (chordTones.third && normalizeNote(chordTones.third) === normalizedNote) return 'third';
    if (chordTones.fifth && normalizeNote(chordTones.fifth) === normalizedNote) return 'fifth';
    if (chordTones.seventh && normalizeNote(chordTones.seventh) === normalizedNote) return 'seventh';
    if (chordTones.ninth && normalizeNote(chordTones.ninth) === normalizedNote) return 'ninth';

    return null;
  }

  function normalizeNote(note) {
    if (!note) return '';
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
    <div class="scale-info mb-2 text-xs text-gray-300">
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
            {@const chordToneType = getChordToneType(note)}

            <div class="fret" class:fret-0={fret === 0}>
              {#if highlighted}
                <div class="note"
                     class:root={chordToneType === 'root'}
                     class:third={chordToneType === 'third'}
                     class:fifth={chordToneType === 'fifth'}
                     class:seventh={chordToneType === 'seventh'}
                     class:ninth={chordToneType === 'ninth'}
                     class:scale-note={!chordToneType}
                     title={chordToneType ? chordToneType : 'scale note'}>
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
            <span class="text-xs">{fret}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Legend -->
  {#if chordTones && chordTones.all && chordTones.all.length > 0}
    <div class="legend mt-2 flex flex-wrap gap-2 text-xs">
      <span class="flex items-center gap-1">
        <div class="note-sample root"></div> Root
      </span>
      {#if chordTones.third}
        <span class="flex items-center gap-1">
          <div class="note-sample third"></div> 3rd
        </span>
      {/if}
      {#if chordTones.fifth}
        <span class="flex items-center gap-1">
          <div class="note-sample fifth"></div> 5th
        </span>
      {/if}
      {#if chordTones.seventh}
        <span class="flex items-center gap-1">
          <div class="note-sample seventh"></div> 7th
        </span>
      {/if}
      {#if chordTones.ninth}
        <span class="flex items-center gap-1">
          <div class="note-sample ninth"></div> 9th
        </span>
      {/if}
      <span class="flex items-center gap-1">
        <div class="note-sample scale-note"></div> Scale
      </span>
    </div>
  {/if}
</div>

<style>
  .fretboard-container {
    width: 100%;
    overflow-x: auto;
    background: #1a1a2e;
    padding: 0.75rem;
    border-radius: 0.5rem;
  }

  .scale-info {
    text-align: center;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .fretboard {
    position: relative;
    min-width: 700px;
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
    height: 1rem;
  }

  .marker {
    width: 6px;
    height: 6px;
    background: #444;
    border-radius: 50%;
  }

  .marker.double {
    box-shadow: -5px 0 0 #444, 5px 0 0 #444;
  }

  .strings {
    position: relative;
  }

  .string {
    display: flex;
    position: relative;
    height: 2rem;
    margin-bottom: 0.2rem;
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
    width: 2px;
    background: linear-gradient(to right, #999, #bbb, #999);
    z-index: 1;
  }

  .note {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.65rem;
    font-weight: 600;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  /* Chord tone colors */
  .note.root {
    background: #ffd700;
    color: #1a1a2e;
    border: 2px solid #ffed4e;
    font-weight: 700;
  }

  .note.third {
    background: #4ade80;
    color: #1a1a2e;
    border: 2px solid #22c55e;
    font-weight: 700;
  }

  .note.fifth {
    background: #60a5fa;
    color: white;
    border: 2px solid #3b82f6;
    font-weight: 700;
  }

  .note.seventh {
    background: #c084fc;
    color: white;
    border: 2px solid #a855f7;
    font-weight: 700;
  }

  .note.ninth {
    background: #fb923c;
    color: white;
    border: 2px solid #f97316;
    font-weight: 700;
  }

  .note.scale-note {
    background: #e94560;
    color: white;
  }

  .fret-numbers {
    display: flex;
    margin-top: 0.5rem;
    justify-content: space-between;
  }

  .fret-number {
    flex: 1;
    text-align: center;
    font-size: 0.65rem;
    color: #888;
  }

  .fret-number:first-child {
    flex: 0.5;
  }

  .legend {
    padding-top: 0.5rem;
    border-top: 1px solid #444;
    color: #aaa;
  }

  .note-sample {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    display: inline-block;
  }

  .note-sample.root {
    background: #ffd700;
    border: 1px solid #ffed4e;
  }

  .note-sample.third {
    background: #4ade80;
    border: 1px solid #22c55e;
  }

  .note-sample.fifth {
    background: #60a5fa;
    border: 1px solid #3b82f6;
  }

  .note-sample.seventh {
    background: #c084fc;
    border: 1px solid #a855f7;
  }

  .note-sample.ninth {
    background: #fb923c;
    border: 1px solid #f97316;
  }

  .note-sample.scale-note {
    background: #e94560;
  }
</style>
