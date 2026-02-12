import { invoke } from "@tauri-apps/api/core";

export async function getLaunchAtStartupEnabled() {
  return await invoke("get_launch_at_startup_enabled");
}

/**
 * @param {boolean} enabled
 */
export async function setLaunchAtStartupEnabled(enabled) {
  await invoke("set_launch_at_startup_enabled", { enabled });
}
