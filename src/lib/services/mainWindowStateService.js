import {
  availableMonitors,
  currentMonitor,
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize
} from "@tauri-apps/api/window";

const MAIN_LAYOUT_STORAGE_KEY = "rm.mainWindow.layout.v1";
const MAIN_MIN_WIDTH = 1100;
const MAIN_MIN_HEIGHT = 620;
const MAIN_DEFAULT_WIDTH = 1140;
const MAIN_DEFAULT_HEIGHT = 720;

/**
 * @typedef {{
 *   x?: number;
 *   y?: number;
 *   width?: number;
 *   height?: number;
 * }} MainLayout
 */

/**
 * @returns {MainLayout | null}
 */
function loadMainLayout() {
  try {
    const raw = localStorage.getItem(MAIN_LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {MainLayout} layout
 */
function saveMainLayout(layout) {
  localStorage.setItem(MAIN_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}

function clearMainLayout() {
  localStorage.removeItem(MAIN_LAYOUT_STORAGE_KEY);
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * @param {import("@tauri-apps/api/window").Monitor[]} monitors
 * @param {MainLayout} layout
 */
function pickMonitorForLayout(monitors, layout) {
  const x = layout.x ?? Number.NaN;
  const y = layout.y ?? Number.NaN;
  if (Number.isFinite(x) && Number.isFinite(y)) {
    const matched = monitors.find((monitor) => {
      const left = monitor.position.x;
      const top = monitor.position.y;
      const right = left + monitor.size.width;
      const bottom = top + monitor.size.height;
      return x >= left && x <= right && y >= top && y <= bottom;
    });
    if (matched) return matched;
  }
  return monitors[0] ?? null;
}

/**
 * Restore persisted main window size/position.
 * Safe no-op for first launch when no persisted layout exists.
 */
export async function restoreMainWindowLayout() {
  const appWindow = getCurrentWindow();
  if (appWindow.label !== "main") return;

  const layout = loadMainLayout();
  if (!layout) return;

  const monitors = await availableMonitors();
  if (!monitors.length) return;

  const monitor = pickMonitorForLayout(monitors, layout);
  if (!monitor) return;

  const width = clamp(
    Math.round(layout.width ?? MAIN_MIN_WIDTH),
    MAIN_MIN_WIDTH,
    monitor.size.width
  );
  const height = clamp(
    Math.round(layout.height ?? MAIN_MIN_HEIGHT),
    MAIN_MIN_HEIGHT,
    monitor.size.height
  );

  const maxX = monitor.position.x + monitor.size.width - width;
  const maxY = monitor.position.y + monitor.size.height - height;
  const x = clamp(
    Math.round(layout.x ?? monitor.position.x),
    monitor.position.x,
    maxX
  );
  const y = clamp(
    Math.round(layout.y ?? monitor.position.y),
    monitor.position.y,
    maxY
  );

  await appWindow.setSize(new PhysicalSize(width, height));
  await appWindow.setPosition(new PhysicalPosition(x, y));
}

/**
 * Reset main window layout to defaults and clear persisted state.
 */
export async function resetMainWindowLayout() {
  const appWindow = getCurrentWindow();
  if (appWindow.label !== "main") return;

  clearMainLayout();

  const monitors = await availableMonitors();
  if (!monitors.length) return;
  const monitor = (await currentMonitor()) ?? monitors[0];

  const width = clamp(MAIN_DEFAULT_WIDTH, MAIN_MIN_WIDTH, monitor.size.width);
  const height = clamp(MAIN_DEFAULT_HEIGHT, MAIN_MIN_HEIGHT, monitor.size.height);
  const x = Math.round(monitor.position.x + (monitor.size.width - width) / 2);
  const y = Math.round(monitor.position.y + (monitor.size.height - height) / 2);

  await appWindow.setSize(new PhysicalSize(width, height));
  await appWindow.setPosition(new PhysicalPosition(x, y));
  saveMainLayout({ x, y, width, height });
}

/**
 * Persist current main window size and position while user moves/resizes.
 * @returns {Promise<() => void>}
 */
export async function initMainWindowLayoutPersistence() {
  const appWindow = getCurrentWindow();
  if (appWindow.label !== "main") return () => {};

  /**
   * @param {MainLayout} patch
   */
  const persist = async (patch) => {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) return;
    const layout = loadMainLayout() ?? {};
    saveMainLayout({ ...layout, ...patch });
  };

  const unlistenMoved = await appWindow.onMoved(({ payload }) => {
    void persist({ x: payload.x, y: payload.y });
  });

  const unlistenResized = await appWindow.onResized(({ payload }) => {
    void persist({ width: payload.width, height: payload.height });
  });

  return () => {
    unlistenMoved();
    unlistenResized();
  };
}
