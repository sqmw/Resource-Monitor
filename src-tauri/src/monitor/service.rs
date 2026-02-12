use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use sysinfo::{Disks, Networks, ProcessesToUpdate, System};

use crate::monitor::models::{MonitorSnapshot, NetworkMetrics, ResourceMetrics};

struct NetworkAccumulator {
    last_received_total: u64,
    last_transmitted_total: u64,
    last_collected_at: Option<Instant>,
    download_peak_bytes_per_sec: f64,
    upload_peak_bytes_per_sec: f64,
}

static SYSTEM: OnceLock<Mutex<System>> = OnceLock::new();
static NETWORKS: OnceLock<Mutex<Networks>> = OnceLock::new();
static DISKS: OnceLock<Mutex<Disks>> = OnceLock::new();
static NETWORK_ACCUMULATOR: OnceLock<Mutex<NetworkAccumulator>> = OnceLock::new();

fn system() -> &'static Mutex<System> {
    SYSTEM.get_or_init(|| Mutex::new(System::new_all()))
}

fn networks() -> &'static Mutex<Networks> {
    NETWORKS.get_or_init(|| Mutex::new(Networks::new_with_refreshed_list()))
}

fn disks() -> &'static Mutex<Disks> {
    DISKS.get_or_init(|| Mutex::new(Disks::new_with_refreshed_list()))
}

fn network_accumulator() -> &'static Mutex<NetworkAccumulator> {
    NETWORK_ACCUMULATOR.get_or_init(|| {
        Mutex::new(NetworkAccumulator {
            last_received_total: 0,
            last_transmitted_total: 0,
            last_collected_at: None,
            download_peak_bytes_per_sec: 0.0,
            upload_peak_bytes_per_sec: 0.0,
        })
    })
}

pub fn collect_snapshot() -> Result<MonitorSnapshot, String> {
    let resources = collect_resources()?;
    let network = collect_network()?;
    let collected_at_unix_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("system clock error: {error}"))?
        .as_millis();

    Ok(MonitorSnapshot {
        collected_at_unix_ms,
        resources,
        network,
    })
}

fn collect_resources() -> Result<ResourceMetrics, String> {
    let mut system = system()
        .lock()
        .map_err(|_| "failed to lock system collector".to_string())?;

    system.refresh_cpu_usage();
    system.refresh_memory();
    system.refresh_processes(ProcessesToUpdate::All, true);

    let mut disks = disks()
        .lock()
        .map_err(|_| "failed to lock disks collector".to_string())?;
    disks.refresh(true);
    let (disk_total_bytes, disk_used_bytes) = disks.iter().fold(
        (0_u64, 0_u64),
        |(total, used), disk| {
            let disk_total = disk.total_space();
            let disk_used = disk_total.saturating_sub(disk.available_space());
            (total + disk_total, used + disk_used)
        },
    );

    Ok(ResourceMetrics {
        cpu_usage_percent: system.global_cpu_usage(),
        memory_used_bytes: system.used_memory(),
        memory_total_bytes: system.total_memory(),
        swap_used_bytes: system.used_swap(),
        swap_total_bytes: system.total_swap(),
        disk_used_bytes,
        disk_total_bytes,
        process_count: system.processes().len(),
        uptime_seconds: System::uptime(),
    })
}

fn collect_network() -> Result<NetworkMetrics, String> {
    let now = Instant::now();
    let mut networks = networks()
        .lock()
        .map_err(|_| "failed to lock network collector".to_string())?;

    networks.refresh(true);

    let (received_total_bytes, transmitted_total_bytes) =
        networks
            .iter()
            .fold((0_u64, 0_u64), |(received, transmitted), (_, data)| {
                (
                    received + data.total_received(),
                    transmitted + data.total_transmitted(),
                )
            });

    let mut accumulator = network_accumulator()
        .lock()
        .map_err(|_| "failed to lock network accumulator".to_string())?;

    let elapsed = accumulator
        .last_collected_at
        .map(|last| now.saturating_duration_since(last))
        .unwrap_or(Duration::from_secs(1));

    let elapsed_secs = elapsed.as_secs_f64().max(0.001);
    let received_delta = received_total_bytes.saturating_sub(accumulator.last_received_total);
    let transmitted_delta =
        transmitted_total_bytes.saturating_sub(accumulator.last_transmitted_total);
    let download_bytes_per_sec = received_delta as f64 / elapsed_secs;
    let upload_bytes_per_sec = transmitted_delta as f64 / elapsed_secs;

    accumulator.last_received_total = received_total_bytes;
    accumulator.last_transmitted_total = transmitted_total_bytes;
    accumulator.last_collected_at = Some(now);
    accumulator.download_peak_bytes_per_sec = accumulator
        .download_peak_bytes_per_sec
        .max(download_bytes_per_sec);
    accumulator.upload_peak_bytes_per_sec =
        accumulator.upload_peak_bytes_per_sec.max(upload_bytes_per_sec);

    Ok(NetworkMetrics {
        received_total_bytes,
        transmitted_total_bytes,
        download_bytes_per_sec,
        upload_bytes_per_sec,
        download_peak_bytes_per_sec: accumulator.download_peak_bytes_per_sec,
        upload_peak_bytes_per_sec: accumulator.upload_peak_bytes_per_sec,
    })
}
