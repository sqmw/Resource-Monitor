<script>
  let { themes, selectedTheme, onSelect } = $props();
</script>

<section class="picker">
  {#each themes as theme}
    <button
      class:active={selectedTheme === theme.id}
      type="button"
      onclick={() => onSelect(theme.id)}
    >
      {theme.label}
    </button>
  {/each}
</section>

<style>
  .picker {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  button {
    color: var(--text-main);
    border: 1px solid var(--card-border);
    background: rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    padding: 0.35rem 0.8rem;
    font-size: 0.82rem;
    transition: transform 180ms ease, background-color 180ms ease;
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
