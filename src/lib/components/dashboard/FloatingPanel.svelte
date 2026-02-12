<script>
  let {
    cpuValue,
    memoryValue,
    memoryTotal,
    downloadValue,
    uploadValue,
    sampledAt,
    labels,
    surfaceOpacity = 44,
    frostedBlur = 16
  } = $props();
</script>

<section
  class="floating-panel"
  style={`--rm-surface-alpha:${Math.max(0, Math.min(100, surfaceOpacity)) / 100};--rm-frosted-blur:${Math.max(0, Math.min(30, frostedBlur))}px;`}
  role="presentation"
>
  <header class="top">
    <p class="title">{labels.title}</p>
    <p class="time">{sampledAt}</p>
  </header>

  <div class="metrics">
    <p>CPU <strong>{cpuValue}</strong></p>
    <p>MEM <strong>{memoryValue}</strong> <span class="sub">/ {memoryTotal}</span></p>
    <p>DL <strong>{downloadValue}</strong></p>
    <p>UL <strong>{uploadValue}</strong></p>
  </div>
</section>

<style>
  .floating-panel {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    border: 1px solid transparent;
    background: transparent;
    backdrop-filter: none;
    box-shadow: none;
    padding: 0.48rem 0.55rem;
    display: grid;
    gap: 0.36rem;
    user-select: none;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.4rem;
  }

  .title {
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-subtle);
    white-space: nowrap;
  }

  .time {
    font-size: 0.76rem;
    font-variant-numeric: tabular-nums;
    color: color-mix(in srgb, var(--text-main) 88%, white);
  }

  .metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.26rem 0.5rem;
  }

  .metrics p {
    font-size: 0.82rem;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  strong {
    font-size: 0.94rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .sub {
    font-size: 0.72rem;
    color: var(--text-subtle);
  }

  .floating-panel {
    background: rgba(7, 18, 27, var(--rm-surface-alpha));
    backdrop-filter: blur(var(--rm-frosted-blur)) saturate(128%);
  }
</style>
