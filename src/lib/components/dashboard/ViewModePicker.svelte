<script>
  let { viewModes, activeModes, language, onToggle } = $props();
</script>

<section class="picker">
  {#each viewModes as mode}
    <button
      class:active={Boolean(activeModes?.[mode.id])}
      type="button"
      onclick={() => onToggle(mode.id)}
    >
      {mode.label[language]}
    </button>
  {/each}
</section>

<style>
  .picker {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  button {
    color: var(--text-main);
    border: 1px solid var(--card-border);
    background: rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    padding: 0.25rem 0.62rem;
    font-size: 0.76rem;
    transition: transform 140ms ease, background-color 140ms ease;
  }

  button:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.14);
  }

  button.active {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
</style>
