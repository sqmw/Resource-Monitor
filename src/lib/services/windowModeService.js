import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import {
  availableMonitors,
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
  PhysicalSize,
  Window
} from "@tauri-apps/api/window";
import { DISPLAY_WINDOW_CONFIG } from "../config/displayConfig";

const DISPLAY_MODE_STORAGE_KEY = "rm.displayMode";
const DISPLAY_VISIBILITY_STORAGE_KEY = "rm.displayVisibility";
const TOPMOST_POLICY_STORAGE_KEY = "rm.topmostPolicy";
const CLICK_THROUGH_STORAGE_KEY = "rm.clickThrough";
const LAYOUT_STORAGE_KEY = "rm.window.layout.v2";
const EDGE_GAP = 8;
const FLOATING_TOP_GAP = 52;
const AUTO_FULLSCREEN_ENTER_TICKS = 5;
const AUTO_FULLSCREEN_EXIT_TICKS = 2;

/** @typedef {"taskbar" | "floating"} DisplayMode */
/** @typedef {"auto" | "always" | "manual"} TopmostPolicy */

/**
 * @typedef {{
 *   monitorName?: string | null;
 *   x?: number;
 *   y?: number;
 *   width?: number;
 *   height?: number;
 *   manualPosition?: boolean;
 * }} DisplayLayout
 */

/**
 * @typedef {{
 *   taskbar?: DisplayLayout;
 *   floating?: DisplayLayout;
 * }} LayoutStore
 */

/**
 * @returns {LayoutStore}
 */
function loadLayoutStore() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * @param {LayoutStore} value
 */
function saveLayoutStore(value) {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(value));
}

/**
 * @returns {DisplayMode}
 */
export function loadDisplayMode() {
  const raw = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
  return raw === "floating" ? "floating" : "taskbar";
}

/**
 * @param {DisplayMode} mode
 */
function persistDisplayMode(mode) {
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, mode);
}

/**
 * @returns {{ taskbar: boolean; floating: boolean }}
 */
export function loadDisplayVisibility() {
  try {
    const raw = localStorage.getItem(DISPLAY_VISIBILITY_STORAGE_KEY);
    if (!raw) return { taskbar: true, floating: false };
    const parsed = JSON.parse(raw);
    return {
      taskbar: parsed?.taskbar !== false,
      floating: parsed?.floating === true
    };
  } catch {
    return { taskbar: true, floating: false };
  }
}

/**
 * @param {{ taskbar: boolean; floating: boolean }} value
 */
function saveDisplayVisibility(value) {
  localStorage.setItem(DISPLAY_VISIBILITY_STORAGE_KEY, JSON.stringify(value));
}

/**
 * @param {string} label
 */
async function getWindowByLabel(label) {
  return Window.getByLabel(label);
}

/**
 * Force Windows z-order refresh for always-on-top windows.
 * @param {import("@tauri-apps/api/window").Window} windowRef
 */
async function liftWindowToTop(windowRef) {
  await setAlwaysOnBottomIfPossible(windowRef, false);
  await windowRef.setAlwaysOnTop(false);
  await windowRef.setAlwaysOnTop(true);
}

/**
 * @param {import("@tauri-apps/api/window").Window} windowRef
 * @param {boolean} enabled
 */
async function setAlwaysOnBottomIfPossible(windowRef, enabled) {
  try {
    await windowRef.setAlwaysOnBottom(enabled);
  } catch {
    // Not all platforms/capabilities expose always-on-bottom.
  }
}

/**
 * @returns {TopmostPolicy}
 */
export function loadTopmostPolicy() {
  const raw = localStorage.getItem(TOPMOST_POLICY_STORAGE_KEY);
  if (raw === "always" || raw === "manual") return raw;
  return "auto";
}

/**
 * @param {TopmostPolicy} policy
 */
export function saveTopmostPolicy(policy) {
  localStorage.setItem(TOPMOST_POLICY_STORAGE_KEY, policy);
}

/**
 * @returns {boolean}
 */
export function loadClickThroughEnabled() {
  return localStorage.getItem(CLICK_THROUGH_STORAGE_KEY) === "true";
}

/**
 * @param {boolean} enabled
 */
export function saveClickThroughEnabled(enabled) {
  localStorage.setItem(CLICK_THROUGH_STORAGE_KEY, String(enabled));
}

/**
 * @returns {Promise<boolean>}
 */
async function isForegroundFullscreen() {
  try {
    return await invoke("is_foreground_fullscreen");
  } catch {
    return false;
  }
}

/**
 * @param {import("@tauri-apps/api/window").Window} windowRef
 * @param {TopmostPolicy} policy
 */
async function applyTopmostPolicy(windowRef, policy) {
  if (policy === "manual") {
    await windowRef.setAlwaysOnTop(false);
    return;
  }

  if (policy === "always") {
    await liftWindowToTop(windowRef);
    return;
  }

  // In auto mode, default to topmost and let guard timer handle fullscreen suppression
  // with hysteresis to avoid false positives from transient popup windows.
  await liftWindowToTop(windowRef);
}

/**
 * @param {import("@tauri-apps/api/window").Window} windowRef
 * @param {boolean} enabled
 */
async function setAutoTopmostState(windowRef, enabled) {
  if (enabled) {
    await setAlwaysOnBottomIfPossible(windowRef, false);
    await windowRef.setAlwaysOnTop(true);
    return;
  }
  await windowRef.setAlwaysOnTop(false);
}

/**
 * Taskbar strip should sit above taskbar in desktop scenarios.
 * @param {import("@tauri-apps/api/window").Window} windowRef
 */
async function applyTaskbarLayer(windowRef) {
  await setAlwaysOnBottomIfPossible(windowRef, false);
  await windowRef.setAlwaysOnTop(true);
}

/**
 * @param {import("@tauri-apps/api/window").Window} windowRef
 * @param {TopmostPolicy} policy
 */
async function applyTaskbarTopmostPolicy(windowRef, policy) {
  await setAlwaysOnBottomIfPossible(windowRef, false);

  if (policy === "manual") {
    await windowRef.setAlwaysOnTop(false);
    return;
  }

  if (policy === "always") {
    await windowRef.setAlwaysOnTop(true);
    return;
  }

  // Keep taskbar strip above taskbar in auto mode.
  // Fullscreen suppression for taskbar is intentionally disabled because
  // foreground fullscreen detection may false-trigger on shell surfaces.
  await windowRef.setAlwaysOnTop(true);
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
 * @param {DisplayMode} mode
 * @param {DisplayLayout | undefined} saved
 */
function resolveWindowSize(mode, saved) {
  const base = DISPLAY_WINDOW_CONFIG[mode];
  const width = clamp(saved?.width ?? base.width, base.minWidth, base.width);
  const maxHeight = base.maxHeight ?? base.height;
  const height = clamp(saved?.height ?? base.height, base.minHeight, maxHeight);
  return { width, height };
}

/**
 * @param {PhysicalPosition} position
 */
async function findMonitorByPosition(position) {
  const monitors = await availableMonitors();
  return (
    monitors.find((monitor) => {
      const left = monitor.position.x;
      const top = monitor.position.y;
      const right = left + monitor.size.width;
      const bottom = top + monitor.size.height;
      return position.x >= left && position.x <= right && position.y >= top && position.y <= bottom;
    }) ?? monitors[0] ?? null
  );
}

/**
 * @param {DisplayMode} mode
 * @param {import("@tauri-apps/api/window").Monitor} monitor
 * @param {{ width: number; height: number }} size
 */
function buildDockedPosition(mode, monitor, size) {
  const right = monitor.position.x + monitor.size.width;
  const bottom = monitor.position.y + monitor.size.height;

  if (mode === "taskbar") {
    return new PhysicalPosition(
      right - size.width - EDGE_GAP,
      bottom - size.height - EDGE_GAP
    );
  }

  return new PhysicalPosition(
    right - size.width - EDGE_GAP,
    monitor.position.y + FLOATING_TOP_GAP
  );
}

/**
 * @param {DisplayMode} mode
 * @param {import("@tauri-apps/api/window").Window} windowRef
 */
async function placeWindow(windowRef, mode) {
  const layout = loadLayoutStore();
  const saved = layout[mode];
  const size = resolveWindowSize(mode, saved);
  await windowRef.setSize(new PhysicalSize(size.width, size.height));

  const monitors = await availableMonitors();
  const preferredMonitor =
    monitors.find((monitor) => monitor.name && monitor.name === saved?.monitorName) ??
    monitors[0] ??
    null;

  if (!preferredMonitor) return;

  if (saved?.manualPosition && typeof saved.x === "number" && typeof saved.y === "number") {
    const right = preferredMonitor.position.x + preferredMonitor.size.width - size.width;
    const bottom = preferredMonitor.position.y + preferredMonitor.size.height - size.height;
    const x = clamp(saved.x, preferredMonitor.position.x, right);
    const y = clamp(saved.y, preferredMonitor.position.y, bottom);
    await windowRef.setPosition(new PhysicalPosition(x, y));
    return;
  }

  await windowRef.setPosition(buildDockedPosition(mode, preferredMonitor, size));
}

/**
 * @param {DisplayMode} mode
 */
async function configureDisplayWindow(mode) {
  const windowRef = await getWindowByLabel(mode);
  if (!windowRef) return;

  const base = DISPLAY_WINDOW_CONFIG[mode];
  await windowRef.setResizable(false);
  await setAlwaysOnBottomIfPossible(windowRef, false);
  try {
    await windowRef.setFocusable(false);
  } catch {
    // Not all platforms support focusable changes.
  }
  if (mode === "taskbar") {
    await applyTaskbarTopmostPolicy(windowRef, loadTopmostPolicy());
  } else {
    await applyTopmostPolicy(windowRef, loadTopmostPolicy());
  }
  try {
    await windowRef.setShadow(false);
  } catch {
    // Some platforms may ignore shadow control; safe to continue.
  }
  await windowRef.setSize(new LogicalSize(base.width, base.height));
  await placeWindow(windowRef, mode);
}

/**
 * @param {DisplayMode} mode
 * @param {boolean} visible
 * @param {{ persist?: boolean; focus?: boolean }} [options]
 */
export async function setDisplayVisibility(mode, visible, options = {}) {
  const { persist = true, focus = false } = options;
  const targetWindow = await getWindowByLabel(mode);
  if (!targetWindow) return;

  if (visible) {
    await configureDisplayWindow(mode);
    await targetWindow.show();
    if (mode === "taskbar") {
      await applyTaskbarTopmostPolicy(targetWindow, loadTopmostPolicy());
    } else {
      await applyTopmostPolicy(targetWindow, loadTopmostPolicy());
    }
    if (focus) {
      await targetWindow.setFocus();
    }
  } else {
    await targetWindow.hide();
  }

  const nextVisibility = {
    ...loadDisplayVisibility(),
    [mode]: visible
  };

  if (persist) {
    saveDisplayVisibility(nextVisibility);
    if (visible) {
      persistDisplayMode(mode);
    }
  }

  await emit("app://display-visibility", {
    mode,
    visible,
    visibility: nextVisibility
  });
}

/**
 * @param {import("@tauri-apps/api/window").Window | null} windowRef
 * @param {boolean} enabled
 */
async function setIgnoreCursorIfPossible(windowRef, enabled) {
  if (!windowRef) return;
  try {
    await windowRef.setIgnoreCursorEvents(enabled);
  } catch {
    // Ignore unsupported platforms / permissions and keep app usable.
  }
}

/**
 * @param {boolean} enabled
 */
export async function applyClickThroughToDisplays(enabled) {
  saveClickThroughEnabled(enabled);
  const taskbarWindow = await getWindowByLabel("taskbar");
  const floatingWindow = await getWindowByLabel("floating");
  await setIgnoreCursorIfPossible(taskbarWindow, enabled);
  await setIgnoreCursorIfPossible(floatingWindow, enabled);
}

/**
 * @param {DisplayMode} mode
 */
export async function copyDisplayModeToNextMonitor(mode) {
  const windowRef = await getWindowByLabel(mode);
  if (!windowRef) return;

  const monitors = await availableMonitors();
  if (monitors.length < 2) return;

  const currentMonitor = await findMonitorByPosition(await windowRef.outerPosition());
  if (!currentMonitor) return;

  const currentIndex = monitors.findIndex(
    (monitor) => monitor.name === currentMonitor.name
  );
  const nextMonitor = monitors[(currentIndex + 1) % monitors.length];

  const size = await windowRef.outerSize();
  const position = await windowRef.outerPosition();
  const offsetX = position.x - currentMonitor.position.x;
  const offsetY = position.y - currentMonitor.position.y;

  const maxX = nextMonitor.position.x + nextMonitor.size.width - size.width;
  const maxY = nextMonitor.position.y + nextMonitor.size.height - size.height;
  const nextX = clamp(nextMonitor.position.x + offsetX, nextMonitor.position.x, maxX);
  const nextY = clamp(nextMonitor.position.y + offsetY, nextMonitor.position.y, maxY);

  await windowRef.setPosition(new PhysicalPosition(nextX, nextY));

  const layout = loadLayoutStore();
  saveLayoutStore({
    ...layout,
    [mode]: {
      ...layout[mode],
      monitorName: nextMonitor.name ?? null,
      x: nextX,
      y: nextY,
      width: size.width,
      height: size.height,
      manualPosition: true
    }
  });
}

export async function openMainWindow() {
  const mainWindow = await getWindowByLabel("main");
  if (!mainWindow) return;
  await mainWindow.unminimize();
  await mainWindow.show();
  await mainWindow.setFocus();
}

/**
 * @param {string} eventName
 * @param {(payload: any) => void} callback
 */
export async function listenEvent(eventName, callback) {
  const appWindow = getCurrentWindow();
  return appWindow.listen(eventName, (event) => callback(event.payload));
}

/**
 * @param {"taskbar" | "floating"} role
 */
export async function initDisplayWindowLayoutPersistence(role) {
  const appWindow = getCurrentWindow();
  const unlistenMoved = await appWindow.onMoved(({ payload }) => {
    const layout = loadLayoutStore();
    saveLayoutStore({
      ...layout,
      [role]: {
        ...layout[role],
        x: payload.x,
        y: payload.y,
        manualPosition: true
      }
    });
  });

  const unlistenResized = await appWindow.onResized(({ payload }) => {
    const layout = loadLayoutStore();
    saveLayoutStore({
      ...layout,
      [role]: {
        ...layout[role],
        width: payload.width,
        height: payload.height
      }
    });
  });

  const unlistenFocusChanged = await appWindow.onFocusChanged(({ payload }) => {
    if (payload === false) {
      const policy = loadTopmostPolicy();
      if (role === "taskbar") {
        void applyTaskbarTopmostPolicy(appWindow, policy);
      } else if (policy !== "auto") {
        void applyTopmostPolicy(appWindow, policy);
      }
    }
  });

  let fullscreenTicks = 0;
  let normalTicks = 0;
  let autoTopmostSuppressed = false;
  const topmostGuardTimer = setInterval(() => {
    const policy = loadTopmostPolicy();
    if (policy !== "auto") {
      fullscreenTicks = 0;
      normalTicks = 0;
      autoTopmostSuppressed = false;
      if (role === "taskbar") {
        void applyTaskbarTopmostPolicy(appWindow, policy);
      } else {
        void applyTopmostPolicy(appWindow, policy);
      }
      return;
    }

    void isForegroundFullscreen().then((isFullscreen) => {
      if (isFullscreen) {
        fullscreenTicks += 1;
        normalTicks = 0;
      } else {
        normalTicks += 1;
        fullscreenTicks = 0;
      }

      if (!autoTopmostSuppressed && fullscreenTicks >= AUTO_FULLSCREEN_ENTER_TICKS) {
        autoTopmostSuppressed = true;
        if (role === "taskbar") {
          void applyTaskbarTopmostPolicy(appWindow, "auto");
        } else {
          void setAutoTopmostState(appWindow, false);
        }
        return;
      }

      if (autoTopmostSuppressed && normalTicks >= AUTO_FULLSCREEN_EXIT_TICKS) {
        autoTopmostSuppressed = false;
        if (role === "taskbar") {
          void applyTaskbarTopmostPolicy(appWindow, "auto");
        } else {
          void setAutoTopmostState(appWindow, true);
        }
      } else if (role === "taskbar" && !autoTopmostSuppressed) {
        // Keep taskbar strip above taskbar when not fullscreen.
        void applyTaskbarTopmostPolicy(appWindow, "auto");
      }
    });
  }, 500);

  return () => {
    unlistenMoved();
    unlistenResized();
    unlistenFocusChanged();
    clearInterval(topmostGuardTimer);
  };
}

export async function startTaskbarManualDrag() {
  await startDisplayManualDrag("taskbar");
}

/**
 * @param {"taskbar" | "floating"} role
 */
export async function startDisplayManualDrag(role) {
  const appWindow = getCurrentWindow();
  if (role === "taskbar") {
    await applyTaskbarLayer(appWindow);
  } else {
    await applyTopmostPolicy(appWindow, loadTopmostPolicy());
  }
  try {
    await appWindow.setFocusable(true);
    await appWindow.setFocus();
  } catch {
    // Focusability is platform-dependent and non-fatal here.
  }
  await appWindow.startDragging();

  const monitor = await findMonitorByPosition(await appWindow.outerPosition());
  const position = await appWindow.outerPosition();
  const size = await appWindow.outerSize();
  const layout = loadLayoutStore();
  saveLayoutStore({
    ...layout,
    [role]: {
      ...layout[role],
      monitorName: monitor?.name ?? layout[role]?.monitorName ?? null,
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      manualPosition: true
    }
  });
}

/**
 * @param {number} deltaX
 * @param {number} deltaY
 */
export async function nudgeTaskbarPosition(deltaX, deltaY) {
  await nudgeDisplayPosition("taskbar", deltaX, deltaY);
}

/**
 * @param {"taskbar" | "floating"} role
 * @param {number} deltaX
 * @param {number} deltaY
 */
export async function nudgeDisplayPosition(role, deltaX, deltaY) {
  const appWindow = getCurrentWindow();
  const current = await appWindow.outerPosition();
  const targetX = current.x + deltaX;
  const targetY = current.y + deltaY;
  await appWindow.setPosition(new PhysicalPosition(targetX, targetY));

  const monitor = await findMonitorByPosition(new PhysicalPosition(targetX, targetY));
  const layout = loadLayoutStore();
  saveLayoutStore({
    ...layout,
    [role]: {
      ...layout[role],
      monitorName: monitor?.name ?? layout[role]?.monitorName ?? null,
      x: targetX,
      y: targetY,
      manualPosition: true
    }
  });
}

/**
 * @param {boolean} enabled
 */
export async function setTaskbarManualPositioning(enabled) {
  await setDisplayManualPositioning("taskbar", enabled);
}

/**
 * @param {"taskbar" | "floating"} role
 * @param {boolean} enabled
 */
export async function setDisplayManualPositioning(role, enabled) {
  const appWindow = getCurrentWindow();
  const clickThroughEnabled = loadClickThroughEnabled();
  try {
    await appWindow.setFocusable(enabled);
    if (enabled) {
      await appWindow.setFocus();
    }
  } catch {
    // Focus toggling is best effort.
  }
  if (enabled) {
    if (role === "taskbar") {
      await applyTaskbarLayer(appWindow);
    } else {
      await applyTopmostPolicy(appWindow, loadTopmostPolicy());
    }
    await setIgnoreCursorIfPossible(appWindow, false);
  } else {
    if (role === "taskbar") {
      await applyTaskbarTopmostPolicy(appWindow, loadTopmostPolicy());
    } else {
      await applyTopmostPolicy(appWindow, loadTopmostPolicy());
    }
    await setIgnoreCursorIfPossible(appWindow, clickThroughEnabled);
  }

  const layout = loadLayoutStore();
  saveLayoutStore({
    ...layout,
    [role]: {
      ...layout[role],
      manualPosition: enabled || layout[role]?.manualPosition || false
    }
  });
}

/**
 * @param {TopmostPolicy} policy
 */
export async function applyTopmostPolicyToDisplays(policy) {
  saveTopmostPolicy(policy);
  const taskbarWindow = await getWindowByLabel("taskbar");
  const floatingWindow = await getWindowByLabel("floating");
  if (taskbarWindow) {
    await applyTaskbarTopmostPolicy(taskbarWindow, policy);
  }
  if (floatingWindow) {
    await setAlwaysOnBottomIfPossible(floatingWindow, false);
    await applyTopmostPolicy(floatingWindow, policy);
  }
}
