use crate::monitor::models::MonitorSnapshot;
use crate::monitor::service;

#[tauri::command]
pub fn get_monitor_snapshot() -> Result<MonitorSnapshot, String> {
    service::collect_snapshot()
}
