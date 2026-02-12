export interface ResourceMetrics {
  cpuUsagePercent: number;
  cpuLogicalCores: number;
  cpuFrequencyMhz: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  swapUsedBytes: number;
  swapTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  processCount: number;
  uptimeSeconds: number;
}

export interface NetworkMetrics {
  receivedTotalBytes: number;
  transmittedTotalBytes: number;
  downloadBytesPerSec: number;
  uploadBytesPerSec: number;
  downloadPeakBytesPerSec: number;
  uploadPeakBytesPerSec: number;
}

export interface MonitorSnapshot {
  collectedAtUnixMs: number;
  resources: ResourceMetrics;
  network: NetworkMetrics;
}
