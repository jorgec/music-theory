<script>
  import { parseProgression } from './lib/chordParser.js';
  import { detectKeys, isAtonal, describeKey } from './lib/keyDetection.js';
  import { analyzeHarmonicContext } from './lib/harmonicAnalysis.js';
  import { SCALES, NOTES } from './lib/musicData.js';
  import Fretboard from './lib/components/Fretboard.svelte';
  import CollapsibleSection from './lib/components/CollapsibleSection.svelte';

  let progressionInput = 'Em A7 Dmaj7 Gmaj7';
  let chords = [];
  let possibleKeys = [];
  let selectedKeyIndex = 0;
  let harmonicAnalysis = [];
  let selectedChordIndex = 0;
  let analyzing = false;
  let showAtonal = false;

  // Collapsible section states
  let keyAnalysisOpen = true;
  let chordAnalysisOpen = false;
  let scalesOpen = false;
  let arpeggiosOpen = false;
  let approachNotesOpen = false;
  let licksOpen = false;

  function analyzeProgression() {
    analyzing = true;

    setTimeout(() => {
      chords = parseProgression(progressionInput);

      if (chords.length === 0) {
        analyzing = false;
        return;
      }

      possibleKeys = detectKeys(chords);
      showAtonal = isAtonal(possibleKeys);

      if (possibleKeys.length > 0) {
        harmonicAnalysis = analyzeHarmonicContext(chords, possibleKeys[selectedKeyIndex]);
      } else {
        harmonicAnalysis = analyzeHarmonicContext(chords, null);
      }

      selectedChordIndex = 0;
      keyAnalysisOpen = true;
      chordAnalysisOpen = true;
      analyzing = false;
    }, 100);
  }

  function selectKey(index) {
    selectedKeyIndex = index;
    if (possibleKeys.length > 0) {
      harmonicAnalysis = analyzeHarmonicContext(chords, possibleKeys[selectedKeyIndex]);
    }
  }

  function getScaleNotes(scaleName, root) {
    const scale = SCALES[scaleName];
    if (!scale) {
      console.warn(`Scale not found: ${scaleName}`);
      return [];
    }

    const rootIndex = NOTES.indexOf(root);
    if (rootIndex === -1) {
      console.warn(`Root note not found: ${root}`);
      return [];
    }

    return scale.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });
  }

  function getChordTones(chord) {
    if (!chord || !chord.parsed) return { all: [], root: null, third: null, fifth: null, seventh: null, ninth: null };

    const notes = chord.notes || [];
    if (notes.length === 0) return { all: [], root: null, third: null, fifth: null, seventh: null, ninth: null };

    return {
      all: notes,
      root: notes[0],           // Root is first note
      third: notes[1],          // Third is second note
      fifth: notes[2],          // Fifth is third note
      seventh: notes[3],        // Seventh (if exists)
      ninth: notes[4]           // Ninth (if exists)
    };
  }

  $: currentChordAnalysis = harmonicAnalysis[selectedChordIndex];
  $: currentKey = possibleKeys[selectedKeyIndex];
  $: currentChord = chords[selectedChordIndex];
  $: chordTones = getChordTones(currentChord);
</script>

<main class="min-h-screen bg-gradient-to-br from-music-dark via-music-accent to-music-highlight text-white">
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <header class="mb-6">
      <h1 class="text-3xl font-bold mb-1 bg-gradient-to-r from-music-bright to-yellow-400 bg-clip-text text-transparent">
        Music Theory Analyzer
      </h1>
      <p class="text-sm text-gray-300">
        Intelligent harmonic analysis for guitar chord progressions
      </p>
    </header>

    <!-- Input Section -->
    <div class="bg-music-accent/50 backdrop-blur-sm rounded-lg p-4 mb-4 border border-music-bright/20">
      <div class="flex gap-3">
        <input
          type="text"
          bind:value={progressionInput}
          on:keydown={(e) => e.key === 'Enter' && analyzeProgression()}
          placeholder="e.g., G Em C D or Dm7 G7 Cmaj7"
          class="flex-1 bg-music-dark border border-music-bright/30 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-music-bright transition text-sm"
        />
        <button
          on:click={analyzeProgression}
          disabled={analyzing}
          class="bg-music-bright hover:bg-music-bright/80 disabled:bg-gray-600 px-6 py-2 rounded font-semibold transition text-sm"
        >
          {analyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </div>

    {#if chords.length > 0}
      <!-- Key Analysis Section -->
      <CollapsibleSection title="Key Analysis" bind:open={keyAnalysisOpen} badge={possibleKeys.length > 0 ? `${possibleKeys.length} key(s)` : null}>
        {#if showAtonal}
          <div class="bg-yellow-600/20 border border-yellow-600/50 rounded p-3 mb-4 text-sm">
            <p class="font-semibold">⚠️ Possibly Atonal</p>
            <p class="text-gray-300 mt-1">
              No strong key center detected. This progression may be atonal, polytonal, or highly chromatic.
            </p>
          </div>
        {/if}

        {#if possibleKeys.length > 0}
          <div class="mb-4">
            <p class="text-xs text-gray-300 mb-2">Detected keys (diatonic prioritized):</p>
            <div class="flex flex-wrap gap-2">
              {#each possibleKeys.slice(0, 5) as key, index}
                <button
                  on:click={() => selectKey(index)}
                  class="px-3 py-2 rounded transition text-sm {index === selectedKeyIndex ? 'bg-music-bright' : 'bg-music-dark bg-opacity-50 hover:bg-music-bright hover:bg-opacity-70'}"
                >
                  <div class="font-semibold">{describeKey(key)}</div>
                  <div class="text-xs mt-1 opacity-80">
                    {key.confidence.toFixed(0)}% confidence
                  </div>
                  <div class="text-xs opacity-70">
                    {key.fitness.functionalPercentage.toFixed(0)}% func | {key.fitness.diatonicPercentage.toFixed(0)}% diat
                  </div>
                </button>
              {/each}
            </div>
          </div>

          {#if currentKey}
            <div class="grid md:grid-cols-2 gap-3 mb-4">
              <div class="bg-music-dark/50 rounded p-3">
                <h3 class="font-semibold mb-2 text-sm">Scale Notes</h3>
                <div class="flex flex-wrap gap-2">
                  {#each currentKey.scaleNotes as note}
                    <span class="bg-music-bright/20 px-2 py-1 rounded text-xs">{note}</span>
                  {/each}
                </div>
              </div>

              <div class="bg-music-dark/50 rounded p-3">
                <h3 class="font-semibold mb-2 text-sm">Pattern</h3>
                <p class="text-gray-300 text-sm">
                  {currentKey.analysis.pattern || 'Custom progression'}
                </p>
                {#if currentKey.analysis.hasStrongCadence}
                  <p class="text-xs text-green-400 mt-1">✓ Strong cadence</p>
                {/if}
              </div>
            </div>

            <!-- Harmonic Function Analysis -->
            <div class="bg-music-dark/50 rounded p-3">
              <h3 class="font-semibold mb-2 text-sm">Harmonic Function</h3>
              <div class="flex flex-wrap gap-2">
                {#each currentKey.analysis.chords as chord}
                  <div class="px-2 py-2 rounded text-xs {chord.isDiatonic ? 'bg-music-bright/20' : 'bg-yellow-600/20 border border-yellow-600/50'}">
                    <div class="font-bold">{chord.romanNumeral}</div>
                    <div class="text-xs text-gray-300">{chord.chord}</div>
                    <div class="text-xs text-gray-400 truncate max-w-[120px]" title={chord.function}>{chord.function}</div>
                    {#if chord.chromaticFunction}
                      <div class="text-xs text-yellow-300 mt-1">
                        {chord.chromaticFunction.type.replace(/_/g, ' ')}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
              <div class="mt-2 text-xs text-gray-400 flex gap-2">
                <span class="inline-block bg-music-bright/20 px-2 py-1 rounded">Diatonic</span>
                <span class="inline-block bg-yellow-600/20 border border-yellow-600/50 px-2 py-1 rounded">Chromatic</span>
              </div>
            </div>
          {/if}
        {:else}
          <p class="text-sm text-gray-400">Enter a progression to detect keys.</p>
        {/if}
      </CollapsibleSection>

      <!-- Chord-by-Chord Analysis -->
      <CollapsibleSection title="Chord-by-Chord Analysis" bind:open={chordAnalysisOpen}>
        <div class="flex flex-wrap gap-2 mb-4">
          {#each harmonicAnalysis as analysis, index}
            <button
              on:click={() => {selectedChordIndex = index; scalesOpen = true;}}
              class="px-3 py-2 rounded font-semibold transition text-sm {index === selectedChordIndex ? 'bg-music-bright' : 'bg-music-dark bg-opacity-50 hover:bg-music-bright hover:bg-opacity-70'}"
            >
              {analysis.chord}
            </button>
          {/each}
        </div>

        {#if currentChordAnalysis}
          <!-- Recommended Scales -->
          <CollapsibleSection title="Recommended Scales" bind:open={scalesOpen} badge={currentChordAnalysis.recommendedScales?.length || 0}>
            <div class="space-y-3">
              {#each currentChordAnalysis.recommendedScales.slice(0, 3) as scale}
                <div class="bg-music-dark/50 rounded p-3">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <span class="font-bold text-sm">{scale.root} {scale.scale.replace(/_/g, ' ')}</span>
                      <span class="ml-2 text-xs px-2 py-0.5 rounded"
                            class:bg-green-600={scale.priority === 'very_high' || scale.priority === 'high'}
                            class:bg-yellow-600={scale.priority === 'medium'}
                            class:bg-gray-600={scale.priority === 'context'}>
                        {scale.priority === 'very_high' ? 'Essential' :
                         scale.priority === 'high' ? 'High' :
                         scale.priority === 'medium' ? 'Medium' : 'Context'}
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-300 mb-2">{scale.reason}</p>

                  <Fretboard
                    highlightNotes={getScaleNotes(scale.scale, scale.root)}
                    chordTones={chordTones}
                    scale={`${scale.root} ${scale.scale.replace(/_/g, ' ')}`}
                    compact={true}
                  />
                </div>
              {/each}
            </div>
          </CollapsibleSection>

          <!-- Arpeggios -->
          <CollapsibleSection title="Arpeggios" bind:open={arpeggiosOpen} badge={currentChordAnalysis.arpeggios?.length || 0}>
            <div class="space-y-2">
              {#each currentChordAnalysis.arpeggios as arpeggio}
                <div class="bg-music-dark/50 rounded p-3">
                  <div class="font-semibold text-sm">{arpeggio.name}</div>
                  {#if arpeggio.notes}
                    <div class="flex gap-2 mt-2 flex-wrap">
                      {#each arpeggio.notes as note, idx}
                        <span class="px-2 py-1 rounded text-xs {idx === 0 ? 'bg-yellow-600/40 font-bold' : idx === 3 ? 'bg-purple-600/40 font-bold' : idx === 4 ? 'bg-blue-600/40 font-bold' : 'bg-music-bright/30'}"
                              title={idx === 0 ? 'Root' : idx === 1 ? '3rd' : idx === 2 ? '5th' : idx === 3 ? '7th' : idx === 4 ? '9th' : ''}>
                          {note}
                        </span>
                      {/each}
                    </div>
                  {/if}
                  <p class="text-xs text-gray-300 mt-2">{arpeggio.usage}</p>
                </div>
              {/each}
            </div>
          </CollapsibleSection>

          <!-- Approach Notes -->
          <CollapsibleSection title="Approach Notes & Voice Leading" bind:open={approachNotesOpen}>
            <div class="space-y-2">
              {#each currentChordAnalysis.approachNotes.slice(0, 4) as approach}
                <div class="bg-music-dark/50 rounded p-3">
                  <div class="font-semibold text-sm">{approach.strategy}</div>
                  <p class="text-xs text-gray-300 mb-1">{approach.description}</p>
                  {#if approach.example}
                    <p class="text-xs text-yellow-300 font-mono">{approach.example}</p>
                  {/if}
                  {#if approach.artists}
                    <p class="text-xs text-gray-500 mt-1">Used by: {approach.artists.join(', ')}</p>
                  {/if}
                </div>
              {/each}
            </div>
          </CollapsibleSection>

          <!-- Lick Ideas -->
          <CollapsibleSection title="Lick Ideas & Note Choices" bind:open={licksOpen}>
            <div class="space-y-2">
              {#each currentChordAnalysis.lickIdeas.slice(0, 3) as lick}
                <div class="bg-music-dark/50 rounded p-3">
                  <div class="font-semibold text-sm">{lick.style}</div>
                  <p class="text-xs text-gray-300 mb-1">{lick.description}</p>
                  <p class="text-xs text-yellow-300 font-mono mb-1">{lick.example}</p>
                  <p class="text-xs text-gray-400">💡 {lick.noteChoices}</p>
                  {#if lick.references && lick.references.artists}
                    <p class="text-xs text-gray-500 mt-1">
                      Ref: {lick.references.artists.slice(0, 3).join(', ')}
                    </p>
                  {/if}
                </div>
              {/each}
            </div>
          </CollapsibleSection>
        {/if}
      </CollapsibleSection>
    {/if}

    <!-- Footer -->
    <footer class="text-center text-gray-400 text-xs mt-8">
      <p>Built with Svelte + TailwindCSS | Intelligent harmonic function analysis</p>
    </footer>
  </div>
</main>
