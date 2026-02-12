<script>
  let { modes, selectedMode, onSelect } = $props();
</script>

<section class="picker">
  {#each modes as mode}
    <button
      type="button"
      class:active={mode.id === selectedMode}
      onclick={() => onSelect(mode.id)}
      aria-pressed={mode.id === selectedMode}
    >
      {mode.label}
    </button>
  {/each}
</section>

<style>
  .picker {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  button {
    border-radius: 999px;
    border: 1px solid var(--card-border);
    padding: 0.2rem 0.56rem;
    font-size: 0.74rem;
    color: var(--text-main);
    background: rgba(255, 255, 255, 0.06);
  }

  button.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 20%, transparent);
  }
</style>
