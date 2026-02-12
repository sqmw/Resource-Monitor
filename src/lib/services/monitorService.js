import { invoke } from "@tauri-apps/api/core";

const SNAPSHOT_COMMAND = "get_monitor_snapshot";

export async function fetchMonitorSnapshot() {
  return invoke(SNAPSHOT_COMMAND);
}
