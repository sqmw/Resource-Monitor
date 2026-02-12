<script>
  let {
    cpuValue,
    memoryValue,
    downloadValue,
    uploadValue,
    sampledAt,
    surfaceOpacity = 38,
    frostedBlur = 16,
    onDoubleClick = () => {},
    editMode = false,
    onStartPositioning = () => {},
    onNudgePosition = () => {}
  } = $props();
</script>

<section
  class:editing={editMode}
  class="strip"
  style={`--rm-surface-alpha:${Math.max(0, Math.min(100, surfaceOpacity)) / 100};--rm-frosted-blur:${Math.max(0, Math.min(30, frostedBlur))}px;`}
  ondblclick={() => onDoubleClick?.()}
  role="button"
  tabindex="0"
  onmousedown={(event) => {
    if (editMode && event.button === 0) {
      event.preventDefault();
      onStartPositioning?.();
    }
  }}
  onkeydown={(event) => {
    if (event.key === "Enter") {
      onDoubleClick();
      return;
    }

    if (!editMode) return;
    const base = event.repeat ? 10 : 3;
    const step = event.shiftKey ? base * 2 : base;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onNudgePosition?.(-step, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onNudgePosition?.(step, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      onNudgePosition?.(0, -step);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      onNudgePosition?.(0, step);
    }
  }}
>
  <table class="metrics-table" aria-label="taskbar-metrics">
    <colgroup>
      <col class="col-label" />
      <col class="col-value" />
      <col class="col-label" />
      <col class="col-value" />
      <col class="col-time" />
    </colgroup>
    <tbody>
      <tr>
        <td class="metric-label">CPU</td>
        <td class="metric-value">{cpuValue}</td>
        <td class="metric-label">MEM</td>
        <td class="metric-value">{memoryValue}</td>
        <td class="time">{sampledAt}</td>
      </tr>
      <tr>
        <td class="metric-label">DL</td>
        <td class="metric-value">{downloadValue}</td>
        <td class="metric-label">UL</td>
        <td class="metric-value">{uploadValue}</td>
        <td class="placeholder" aria-hidden="true">00:00:00</td>
      </tr>
    </tbody>
  </table>
</section>

<style>
  .strip {
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.2rem;
    padding: 0.36rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    backdrop-filter: none;
    overflow: hidden;
    user-select: none;
    cursor: default;
    outline: none;
    --rm-text-color: rgba(246, 250, 255, 0.98);
    --rm-time-color: rgba(233, 242, 252, 0.96);
    --rm-text-shadow: 0 1px 1px rgba(0, 0, 0, 0.42);
  }

  .strip.editing {
    border-color: rgba(176, 228, 255, 0.6);
    box-shadow: inset 0 0 0 1px rgba(176, 228, 255, 0.45);
    cursor: move;
  }

  .strip:not(.editing) {
    background: rgba(7, 18, 27, var(--rm-surface-alpha));
    backdrop-filter: blur(var(--rm-frosted-blur)) saturate(125%);
    border-color: transparent;
  }

  td {
    font-size: 0.84rem;
    font-weight: 700;
    line-height: 1.15;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: var(--rm-text-color);
    text-shadow: var(--rm-text-shadow);
    padding: 0;
    vertical-align: middle;
  }

  .metrics-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0.36rem 0.08rem;
    table-layout: fixed;
  }

  .col-label {
    width: 2.9ch;
  }

  .col-time {
    width: 8ch;
  }

  .metric-label {
    overflow: hidden;
    text-overflow: clip;
    opacity: 0.96;
    text-align: left;
  }

  .metric-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
    min-width: 0;
  }

  .time {
    color: var(--rm-time-color);
    text-align: right;
  }

  .placeholder {
    visibility: hidden;
    text-align: right;
  }
</style>
