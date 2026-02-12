<script>
  let { surfaces, selectedSurface, onSelect } = $props();
</script>

<section class="picker">
  {#each surfaces as surface}
    <button
      class:active={selectedSurface === surface.id}
      type="button"
      onclick={() => onSelect(surface.id)}
    >
      {surface.label}
    </button>
  {/each}
</section>

<style>
  .picker {
    display: flex;
    gap: 0.34rem;
    flex-wrap: wrap;
  }

  button {
    color: var(--text-main);
    border: 1px solid var(--card-border);
    background: rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    padding: 0.22rem 0.56rem;
    font-size: 0.74rem;
    transition: transform 120ms ease, background-color 120ms ease;
  }

  button:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.12);
  }

  button.active {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
</style>
