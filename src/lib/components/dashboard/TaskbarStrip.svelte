<script>
  import { DEFAULT_TASKBAR_LAYOUT } from "../../config/displayConfig";

  let {
    cpuValue,
    memoryValue,
    downloadValue,
    uploadValue,
    sampledAt,
    surfaceOpacity = 38,
    frostedBlur = 16,
    textContrastMode = "auto",
    contrastTone = "light",
    contrastRefreshTick = 0,
    layout = DEFAULT_TASKBAR_LAYOUT,
    onDoubleClick = () => {},
    editMode = false,
    onStartPositioning = () => {},
    onNudgePosition = () => {}
  } = $props();

  /**
   * Keep taskbar readable by avoiding ultra-transparent backgrounds in auto mode.
   * @param {number} value
   * @param {string} mode
   */
  function resolveSurfaceAlpha(value, mode) {
    const normalized = Math.max(0, Math.min(100, value)) / 100;
    if (mode === "auto" && normalized === 0) {
      return 0;
    }
    return mode === "auto" ? Math.max(0.2, normalized) : normalized;
  }

  /**
   * Blur sampling can shift perceived brightness; disable in auto mode for stability.
   * @param {number} value
   * @param {string} mode
   * @param {number} opacity
   */
  function resolveFrostedBlur(value, mode, opacity) {
    if (opacity <= 0) return 0;
    const normalized = Math.max(0, Math.min(30, value));
    return mode === "auto" ? Math.min(8, normalized) : normalized;
  }
</script>

<section
  class:auto-contrast={textContrastMode === "auto"}
  class:editing={editMode}
  class="strip"
  style={`--rm-surface-alpha:${resolveSurfaceAlpha(surfaceOpacity, textContrastMode)};--rm-frosted-blur:${resolveFrostedBlur(frostedBlur, textContrastMode, surfaceOpacity)}px;--rm-pad-x:${Math.max(2, Math.min(14, layout?.paddingX ?? 7))}px;--rm-pad-y:${Math.max(0, Math.min(4, layout?.paddingY ?? 2))}px;--rm-col-gap:${Math.max(2, Math.min(12, layout?.columnGap ?? 5))}px;--rm-group-gap:${Math.max(0, Math.min(20, layout?.groupGap ?? 6))}px;--rm-font-size:${Math.max(10, Math.min(15, layout?.fontSize ?? 12))}px;--rm-contrast-refresh:${Math.max(0, contrastRefreshTick % 1000000)};`}
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
  <div class="metrics-grid" role="table" aria-label="taskbar-metrics">
    <span class="metric-label" role="cell">CPU</span>
    <span class="metric-value" role="cell">{cpuValue}</span>
    <span class="metric-label metric-label-group-2" role="cell">MEM</span>
    <span class="metric-value" role="cell">{memoryValue}</span>
    <span class="time" role="cell">{sampledAt}</span>

    <span class="metric-label" role="cell">DL</span>
    <span class="metric-value" role="cell">{downloadValue}</span>
    <span class="metric-label metric-label-group-2" role="cell">UL</span>
    <span class="metric-value" role="cell">{uploadValue}</span>
    <span class="placeholder" aria-hidden="true" role="cell">00:00:00</span>
  </div>
</section>

<style>
  .strip {
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    padding: var(--rm-pad-y) var(--rm-pad-x);
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    backdrop-filter: none;
    overflow: clip;
    user-select: none;
    cursor: default;
    outline: none;
    --rm-text-color: rgba(255, 255, 255, 0.99);
    --rm-time-color: rgba(255, 255, 255, 0.99);
    --rm-text-shadow: 0 1px 1px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0, 0, 0, 0.84);
  }

  .strip.editing {
    border-color: rgba(176, 228, 255, 0.6);
    box-shadow: inset 0 0 0 1px rgba(176, 228, 255, 0.45);
    cursor: move;
  }

  .strip:not(.editing) {
    background: rgba(7, 18, 27, var(--rm-surface-alpha));
    backdrop-filter: blur(var(--rm-frosted-blur)) saturate(112%);
    border-color: transparent;
  }

  .metrics-grid {
    width: 100%;
    height: auto;
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) max-content minmax(0, 1fr) 8ch;
    grid-template-rows: 1fr 1fr;
    column-gap: var(--rm-col-gap);
    row-gap: 1px;
    align-items: center;
    align-content: center;
  }

  .metrics-grid > span {
    font-size: var(--rm-font-size);
    font-weight: 760;
    line-height: 1.02;
    display: flex;
    align-items: center;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: var(--rm-text-color);
    text-shadow: var(--rm-text-shadow);
    min-width: 0;
  }

  .strip.auto-contrast {
    --rm-auto-color: rgba(255, 255, 255, 1);
    --rm-auto-shadow: 0 1px 1px rgba(0, 0, 0, 0.98), 0 0 2.2px rgba(0, 0, 0, 0.88);
  }

  .strip.auto-contrast .metrics-grid > span {
    color: var(--rm-auto-color);
    text-shadow: var(--rm-auto-shadow);
    -webkit-text-stroke: 0;
    font-weight: 820;
    transform: translateZ(calc(var(--rm-contrast-refresh) * 0px));
  }

  .metric-label {
    opacity: 1;
    text-align: left;
    white-space: nowrap;
    overflow: visible;
    font-weight: 760;
  }

  .metric-label-group-2 {
    margin-left: var(--rm-group-gap);
  }

  .metric-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    min-width: 0;
    font-weight: 850;
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
