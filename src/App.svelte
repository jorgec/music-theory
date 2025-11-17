<script>
  import { parseProgression } from './lib/chordParser.js';
  import { detectKeys, isAtonal, describeKey } from './lib/keyDetection.js';
  import { analyzeHarmonicContext } from './lib/harmonicAnalysis.js';
  import { SCALES, NOTES } from './lib/musicData.js';
  import Fretboard from './lib/components/Fretboard.svelte';

  let progressionInput = 'Em A7 Dmaj7 Gmaj7';
  let chords = [];
  let possibleKeys = [];
  let selectedKeyIndex = 0;
  let harmonicAnalysis = [];
  let selectedChordIndex = 0;
  let analyzing = false;
  let showAtonal = false;

  function analyzeProgression() {
    analyzing = true;

    setTimeout(() => {
      // Parse the progression
      chords = parseProgression(progressionInput);

      if (chords.length === 0) {
        analyzing = false;
        return;
      }

      // Detect possible keys
      possibleKeys = detectKeys(chords);

      // Check if atonal
      showAtonal = isAtonal(possibleKeys);

      // Perform harmonic analysis using best key match
      if (possibleKeys.length > 0) {
        harmonicAnalysis = analyzeHarmonicContext(chords, possibleKeys[selectedKeyIndex]);
      } else {
        harmonicAnalysis = analyzeHarmonicContext(chords, null);
      }

      selectedChordIndex = 0;
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
    if (!scale) return [];

    const rootIndex = NOTES.indexOf(root);
    if (rootIndex === -1) return [];

    return scale.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });
  }

  $: currentChordAnalysis = harmonicAnalysis[selectedChordIndex];
  $: currentKey = possibleKeys[selectedKeyIndex];
</script>

<main class="min-h-screen bg-gradient-to-br from-music-dark via-music-accent to-music-highlight text-white">
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <header class="mb-8">
      <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-music-bright to-yellow-400 bg-clip-text text-transparent">
        Music Theory Analyzer
      </h1>
      <p class="text-gray-300">
        Intelligent harmonic analysis for guitar chord progressions
      </p>
    </header>

    <!-- Input Section -->
    <div class="bg-music-accent/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-music-bright/20">
      <label for="progression" class="block text-sm font-semibold mb-2 text-gray-300">
        Enter Chord Progression
      </label>
      <div class="flex gap-3">
        <input
          id="progression"
          type="text"
          bind:value={progressionInput}
          on:keydown={(e) => e.key === 'Enter' && analyzeProgression()}
          placeholder="e.g., Em A7 Dmaj7 Gmaj7 or Cm7 F7 Bbmaj7 Ebmaj7"
          class="flex-1 bg-music-dark border border-music-bright/30 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-music-bright transition"
        />
        <button
          on:click={analyzeProgression}
          disabled={analyzing}
          class="bg-music-bright hover:bg-music-bright/80 disabled:bg-gray-600 px-6 py-3 rounded font-semibold transition"
        >
          {analyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      <p class="text-xs text-gray-400 mt-2">
        Supports all chord types: major, minor, 7th, 9th, 11th, 13th, altered (b9, #9, b5, #5, #11), slash chords, etc.
      </p>
    </div>

    {#if chords.length > 0}
      <!-- Key Detection -->
      <div class="bg-music-accent/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-music-bright/20">
        <h2 class="text-2xl font-bold mb-4">Key Analysis</h2>

        {#if showAtonal}
          <div class="bg-yellow-600/20 border border-yellow-600/50 rounded p-4 mb-4">
            <p class="font-semibold">⚠️ Possibly Atonal</p>
            <p class="text-sm text-gray-300 mt-1">
              No strong key center detected. This progression may be atonal, polytonal, or highly chromatic.
            </p>
          </div>
        {/if}

        {#if possibleKeys.length > 0}
          <div class="mb-4">
            <p class="text-sm text-gray-300 mb-2">Detected {possibleKeys.length} possible key(s) - Diatonic keys prioritized:</p>
            <div class="flex flex-wrap gap-2">
              {#each possibleKeys.slice(0, 5) as key, index}
                <button
                  on:click={() => selectKey(index)}
                  class="px-4 py-2 rounded transition {index === selectedKeyIndex ? 'bg-music-bright' : 'bg-music-dark bg-opacity-50 hover:bg-music-bright hover:bg-opacity-70'}"
                >
                  <div class="font-semibold">{describeKey(key)}</div>
                  <div class="text-xs mt-1 opacity-80">
                    {key.confidence.toFixed(0)}% confidence | {key.fitness.diatonicPercentage.toFixed(0)}% diatonic
                  </div>
                </button>
              {/each}
            </div>
          </div>

          {#if currentKey}
            <div class="grid md:grid-cols-2 gap-4">
              <div class="bg-music-dark/50 rounded p-4">
                <h3 class="font-semibold mb-2">Scale Notes</h3>
                <div class="flex flex-wrap gap-2">
                  {#each currentKey.scaleNotes as note}
                    <span class="bg-music-bright/20 px-3 py-1 rounded">{note}</span>
                  {/each}
                </div>
              </div>

              <div class="bg-music-dark/50 rounded p-4">
                <h3 class="font-semibold mb-2">Progression Pattern</h3>
                <p class="text-gray-300">
                  {currentKey.analysis.pattern || 'Custom progression'}
                </p>
                {#if currentKey.analysis.hasStrongCadence}
                  <p class="text-sm text-green-400 mt-1">✓ Contains strong cadence</p>
                {/if}
              </div>
            </div>

            <!-- Roman Numeral Analysis -->
            <div class="mt-4 bg-music-dark/50 rounded p-4">
              <h3 class="font-semibold mb-2">Roman Numeral Analysis</h3>
              <div class="flex flex-wrap gap-3">
                {#each currentKey.analysis.chords as chord}
                  <div class="bg-music-bright/20 px-3 py-2 rounded">
                    <div class="font-bold text-lg">{chord.romanNumeral}</div>
                    <div class="text-xs text-gray-300">{chord.chord}</div>
                    <div class="text-xs text-gray-400">{chord.function}</div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {:else}
          <p class="text-gray-400">Enter a progression to detect possible keys.</p>
        {/if}
      </div>

      <!-- Chord-by-Chord Analysis -->
      <div class="bg-music-accent/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-music-bright/20">
        <h2 class="text-2xl font-bold mb-4">Chord-by-Chord Analysis</h2>

        <!-- Chord Selector -->
        <div class="flex flex-wrap gap-2 mb-6">
          {#each harmonicAnalysis as analysis, index}
            <button
              on:click={() => selectedChordIndex = index}
              class="px-4 py-2 rounded font-semibold transition {index === selectedChordIndex ? 'bg-music-bright' : 'bg-music-dark bg-opacity-50 hover:bg-music-bright hover:bg-opacity-70'}"
            >
              {analysis.chord}
            </button>
          {/each}
        </div>

        {#if currentChordAnalysis}
          <div class="space-y-6">
            <!-- Recommended Scales -->
            <div>
              <h3 class="text-xl font-bold mb-3 text-music-bright">Recommended Scales</h3>
              <div class="space-y-3">
                {#each currentChordAnalysis.recommendedScales.slice(0, 4) as scale}
                  <div class="bg-music-dark/50 rounded p-4">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <span class="font-bold text-lg">{scale.root} {scale.scale.replace(/_/g, ' ')}</span>
                        <span class="ml-2 text-xs px-2 py-1 rounded"
                              class:bg-green-600={scale.priority === 'very_high' || scale.priority === 'high'}
                              class:bg-yellow-600={scale.priority === 'medium'}
                              class:bg-gray-600={scale.priority === 'context'}>
                          {scale.priority === 'very_high' ? 'Essential' :
                           scale.priority === 'high' ? 'High Priority' :
                           scale.priority === 'medium' ? 'Medium' : 'Context'}
                        </span>
                      </div>
                    </div>
                    <p class="text-sm text-gray-300 mb-3">{scale.reason}</p>

                    <!-- Fretboard -->
                    <Fretboard
                      highlightNotes={getScaleNotes(scale.scale, scale.root)}
                      scale={`${scale.root} ${scale.scale.replace(/_/g, ' ')}`}
                      compact={true}
                    />
                  </div>
                {/each}
              </div>
            </div>

            <!-- Arpeggios -->
            <div>
              <h3 class="text-xl font-bold mb-3 text-music-bright">Arpeggios</h3>
              <div class="space-y-2">
                {#each currentChordAnalysis.arpeggios as arpeggio}
                  <div class="bg-music-dark/50 rounded p-4">
                    <div class="font-semibold">{arpeggio.name}</div>
                    {#if arpeggio.notes}
                      <div class="flex gap-2 mt-2">
                        {#each arpeggio.notes as note}
                          <span class="bg-music-bright/30 px-2 py-1 rounded text-sm">{note}</span>
                        {/each}
                      </div>
                    {/if}
                    <p class="text-sm text-gray-300 mt-2">{arpeggio.usage}</p>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Approach Notes -->
            <div>
              <h3 class="text-xl font-bold mb-3 text-music-bright">Approach Note Strategies</h3>
              <div class="space-y-2">
                {#each currentChordAnalysis.approachNotes as approach}
                  <div class="bg-music-dark/50 rounded p-4">
                    <div class="font-semibold mb-1">{approach.strategy}</div>
                    <p class="text-sm text-gray-300 mb-1">{approach.description}</p>
                    {#if approach.example}
                      <p class="text-sm text-yellow-300 font-mono">{approach.example}</p>
                    {/if}
                    <p class="text-xs text-gray-400 mt-2">{approach.usage}</p>
                    {#if approach.artists}
                      <p class="text-xs text-gray-500 mt-1">Used by: {approach.artists.join(', ')}</p>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <!-- Voice Leading -->
            {#if currentChordAnalysis.voiceLeading && currentChordAnalysis.voiceLeading.length > 0}
              <div>
                <h3 class="text-xl font-bold mb-3 text-music-bright">Voice Leading</h3>
                <div class="space-y-2">
                  {#each currentChordAnalysis.voiceLeading as voice}
                    <div class="bg-music-dark/50 rounded p-4">
                      <div class="font-semibold mb-1">{voice.type}</div>
                      <p class="text-sm text-gray-300">{voice.description}</p>
                      <p class="text-xs text-gray-400 mt-1">{voice.reason}</p>
                      {#if voice.notes}
                        <div class="flex gap-2 mt-2">
                          {#each voice.notes as note}
                            <span class="bg-green-600/30 px-2 py-1 rounded text-sm">{note}</span>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Lick Ideas -->
            <div>
              <h3 class="text-xl font-bold mb-3 text-music-bright">Lick Ideas & Note Choices</h3>
              <div class="space-y-3">
                {#each currentChordAnalysis.lickIdeas as lick}
                  <div class="bg-music-dark/50 rounded p-4">
                    <div class="font-semibold text-lg mb-2">{lick.style}</div>
                    <p class="text-sm text-gray-300 mb-2">{lick.description}</p>
                    <p class="text-sm text-yellow-300 font-mono mb-2">{lick.example}</p>
                    <p class="text-sm text-gray-400 mb-2">💡 {lick.noteChoices}</p>
                    {#if lick.references && lick.references.artists}
                      <p class="text-xs text-gray-500">
                        References: {lick.references.artists.join(', ')}
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <!-- Insights -->
            {#if currentChordAnalysis.insights && currentChordAnalysis.insights.length > 0}
              <div>
                <h3 class="text-xl font-bold mb-3 text-music-bright">Theory Insights</h3>
                <div class="space-y-2">
                  {#each currentChordAnalysis.insights as insight}
                    <div class="bg-music-dark/50 rounded p-4">
                      <div class="font-semibold text-sm text-music-bright mb-1">{insight.category}</div>
                      <p class="text-sm text-gray-300">{insight.text}</p>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Footer -->
    <footer class="text-center text-gray-400 text-sm mt-12">
      <p>Built with Svelte + TailwindCSS | 12-Factor App Architecture</p>
      <p class="mt-1">Comprehensive music theory analysis for 6-string guitar</p>
    </footer>
  </div>
</main>
