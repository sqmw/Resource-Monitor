<script>
  let { label, valueText, percent, warning = false } = $props();
</script>

<section class="panel">
  <div class="row">
    <p class="label">{label}</p>
    <p class="value">{valueText}</p>
  </div>
  <div class="track">
    <div
      class:warning
      class="bar"
      style={`width: ${Math.min(Math.max(percent, 0), 100).toFixed(1)}%`}
    ></div>
  </div>
</section>

<style>
  .panel {
    display: grid;
    gap: 0.45rem;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .label {
    color: var(--text-subtle);
    font-size: 0.82rem;
  }

  .value {
    color: var(--text-main);
    font-size: 0.84rem;
    font-weight: 700;
  }

  .track {
    width: 100%;
    height: 9px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
  }

  .bar {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent), #99fff3);
    transition: width 240ms ease-in-out;
  }

  .bar.warning {
    background: linear-gradient(90deg, var(--warning), var(--danger));
  }
</style>
