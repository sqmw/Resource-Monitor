<script>
  let { title, value, subtitle, accent = false } = $props();
</script>

<article class:accent class="tile">
  <p class="title">{title}</p>
  <p class="value">{value}</p>
  <p class="subtitle">{subtitle}</p>
</article>

<style>
  .tile {
    padding: 0.8rem;
    border-radius: 14px;
    background: var(--card);
    border: 1px solid var(--card-border);
    box-shadow: var(--shadow);
    display: grid;
    grid-template-rows: 1.05rem 2.15rem minmax(0.8rem, auto);
    gap: 0.28rem;
    align-content: start;
  }

  .tile.accent {
    background: linear-gradient(130deg, var(--accent-soft), var(--card));
  }

  .title {
    color: var(--text-subtle);
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    line-height: 1;
    display: flex;
    align-items: baseline;
  }

  .value {
    color: var(--text-main);
    font-size: clamp(1.05rem, 1.8vw, 1.75rem);
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: baseline;
  }

  .subtitle {
    color: var(--text-subtle);
    font-size: 0.76rem;
    line-height: 1.15;
    display: flex;
    align-items: flex-start;
  }
</style>
