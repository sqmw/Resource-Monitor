<script>
  let { label, hint = "", enabled = false, loading = false, onLabel, offLabel, onToggle } = $props();
</script>

<section class="startup-toggle">
  <div class="copy">
    <p class="label">{label}</p>
    {#if hint}
      <p class="hint">{hint}</p>
    {/if}
  </div>
  <button
    type="button"
    class:active={enabled}
    disabled={loading}
    onclick={() => onToggle(!enabled)}
    aria-pressed={enabled}
  >
    {enabled ? onLabel : offLabel}
  </button>
</section>

<style>
  .startup-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.48rem;
    border: 1px solid var(--card-border);
    border-radius: 9px;
    padding: 0.34rem 0.42rem;
    background: rgba(255, 255, 255, 0.04);
  }

  .copy {
    min-width: 0;
  }

  .label {
    font-size: 0.74rem;
    color: var(--text-main);
  }

  .hint {
    font-size: 0.67rem;
    color: var(--text-subtle);
    margin-top: 0.1rem;
  }

  button {
    border-radius: 999px;
    border: 1px solid var(--card-border);
    padding: 0.2rem 0.56rem;
    font-size: 0.72rem;
    color: var(--text-main);
    background: rgba(255, 255, 255, 0.08);
    white-space: nowrap;
  }

  button.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 24%, transparent);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
