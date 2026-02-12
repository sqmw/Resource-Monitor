import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

const BACKDROP_SAMPLE_COMMAND = "sample_backdrop_luminance";
const DARK_TEXT_ENTER_THRESHOLD = 162;
const DARK_TEXT_EXIT_THRESHOLD = 136;
export const AUTO_CONTRAST_POLL_MS = 2600;

/** @typedef {"light" | "dark"} ContrastTone */

/**
 * @param {number | null | undefined} luminance
 * @param {ContrastTone} previousTone
 * @returns {ContrastTone}
 */
export function resolveContrastTone(luminance, previousTone) {
  if (!Number.isFinite(luminance)) return previousTone;
  const value = Number(luminance);

  // Hysteresis avoids flicker when sampled luminance hovers near threshold.
  if (previousTone === "dark") {
    return value <= DARK_TEXT_EXIT_THRESHOLD ? "light" : "dark";
  }
  return value >= DARK_TEXT_ENTER_THRESHOLD ? "dark" : "light";
}

/**
 * @returns {Promise<number | null>}
 */
export async function sampleCurrentWindowBackdropLuminance() {
  try {
    const appWindow = getCurrentWindow();
    const [position, size] = await Promise.all([appWindow.outerPosition(), appWindow.outerSize()]);
    return await invoke(BACKDROP_SAMPLE_COMMAND, {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height
    });
  } catch {
    return null;
  }
}
