<script>
  let {
    opacity,
    blur,
    labels,
    onOpacityChange,
    onBlurChange
  } = $props();
</script>

<section class="tuner">
  <label>
    <span>{labels.opacity}: {opacity}%</span>
    <input
      type="range"
      min="0"
      max="100"
      step="1"
      value={opacity}
      oninput={(event) => onOpacityChange(Number(event.currentTarget.value))}
    />
  </label>

  <label>
    <span>{labels.blur}: {blur}px</span>
    <input
      type="range"
      min="0"
      max="30"
      step="1"
      value={blur}
      oninput={(event) => onBlurChange(Number(event.currentTarget.value))}
    />
  </label>
</section>

<style>
  .tuner {
    display: grid;
    gap: 0.34rem;
    width: min(320px, 100%);
  }

  label {
    display: grid;
    gap: 0.18rem;
  }

  span {
    font-size: 0.72rem;
    color: var(--text-subtle);
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--accent);
  }
</style>
