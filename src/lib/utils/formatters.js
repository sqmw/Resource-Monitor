/**
 * @param {number} value
 */
export function formatPercent(value) {
  return `${Math.max(0, value).toFixed(1)}%`;
}

/**
 * @param {number} bytes
 */
export function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = Math.max(0, bytes);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * @param {number} bytesPerSec
 */
export function formatRate(bytesPerSec) {
  return `${formatBytes(bytesPerSec)}/s`;
}

/**
 * @param {number} value
 * @param {string} suffix
 */
function formatCompact(value, suffix) {
  const abs = Math.max(0, value);
  if (abs < 1000) return `${Math.round(abs)}${suffix}`;
  if (abs < 1000 * 1000) return `${(abs / 1000).toFixed(abs >= 10 * 1000 ? 0 : 1)}K${suffix}`;
  if (abs < 1000 * 1000 * 1000) {
    return `${(abs / (1000 * 1000)).toFixed(abs >= 10 * 1000 * 1000 ? 0 : 1)}M${suffix}`;
  }
  return `${(abs / (1000 * 1000 * 1000)).toFixed(abs >= 10 * 1000 * 1000 * 1000 ? 0 : 1)}G${suffix}`;
}

/**
 * Compact bytes for taskbar (K/M/G).
 * @param {number} bytes
 */
export function formatCompactBytes(bytes) {
  return formatCompact(bytes, "");
}

/**
 * Compact rate for taskbar (K/M/G per second).
 * @param {number} bytesPerSec
 */
export function formatCompactRate(bytesPerSec) {
  return `${formatCompact(bytesPerSec, "")}/s`;
}

/**
 * @param {number | undefined | null} unixMs
 */
export function formatTimestamp(unixMs) {
  if (!unixMs) return "--:--:--";
  return new Date(unixMs).toLocaleTimeString();
}

/**
 * @param {number} seconds
 */
export function formatUptime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
}
