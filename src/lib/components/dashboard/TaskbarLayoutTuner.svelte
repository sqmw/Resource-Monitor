<script>
  let {
    values,
    labels,
    onPaddingXChange,
    onColumnGapChange,
    onGroupGapChange,
    onFontSizeChange
  } = $props();
</script>

<section class="tuner">
  <label>
    <span>{labels.paddingX}: {values.paddingX}px</span>
    <input
      type="range"
      min="2"
      max="14"
      step="1"
      value={values.paddingX}
      oninput={(event) => onPaddingXChange(Number(event.currentTarget.value))}
    />
  </label>

  <label>
    <span>{labels.columnGap}: {values.columnGap}px</span>
    <input
      type="range"
      min="2"
      max="12"
      step="1"
      value={values.columnGap}
      oninput={(event) => onColumnGapChange(Number(event.currentTarget.value))}
    />
  </label>

  <label>
    <span>{labels.groupGap}: {values.groupGap}px</span>
    <input
      type="range"
      min="0"
      max="20"
      step="1"
      value={values.groupGap}
      oninput={(event) => onGroupGapChange(Number(event.currentTarget.value))}
    />
  </label>

  <label>
    <span>{labels.fontSize}: {values.fontSize}px</span>
    <input
      type="range"
      min="10"
      max="15"
      step="1"
      value={values.fontSize}
      oninput={(event) => onFontSizeChange(Number(event.currentTarget.value))}
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
