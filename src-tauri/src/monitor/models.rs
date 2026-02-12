use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceMetrics {
    pub cpu_usage_percent: f32,
    pub memory_used_bytes: u64,
    pub memory_total_bytes: u64,
    pub swap_used_bytes: u64,
    pub swap_total_bytes: u64,
    pub disk_used_bytes: u64,
    pub disk_total_bytes: u64,
    pub process_count: usize,
    pub uptime_seconds: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkMetrics {
    pub received_total_bytes: u64,
    pub transmitted_total_bytes: u64,
    pub download_bytes_per_sec: f64,
    pub upload_bytes_per_sec: f64,
    pub download_peak_bytes_per_sec: f64,
    pub upload_peak_bytes_per_sec: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorSnapshot {
    pub collected_at_unix_ms: u128,
    pub resources: ResourceMetrics,
    pub network: NetworkMetrics,
}
