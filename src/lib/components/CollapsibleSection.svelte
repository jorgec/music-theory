<script>
  export let title;
  export let open = false;
  export let badge = null;
</script>

<div class="collapsible-section mb-4">
  <button
    on:click={() => open = !open}
    class="w-full bg-music-accent/50 backdrop-blur-sm rounded-lg p-4 border border-music-bright/20 hover:border-music-bright/40 transition flex justify-between items-center"
  >
    <div class="flex items-center gap-3">
      <span class="text-xl">{open ? '▼' : '▶'}</span>
      <h2 class="text-xl font-bold">{title}</h2>
      {#if badge}
        <span class="bg-music-bright px-2 py-1 rounded text-xs font-semibold">{badge}</span>
      {/if}
    </div>
  </button>

  {#if open}
    <div class="mt-2 bg-music-accent/30 backdrop-blur-sm rounded-lg p-6 border border-music-bright/10">
      <slot />
    </div>
  {/if}
</div>

<style>
  .collapsible-section button {
    text-align: left;
  }
</style>
