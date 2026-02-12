# 2026-02-12 Windows Realtime CPU Frequency

## Summary
- 修复 CPU 频率长时间不变的问题，改为 Windows 实时 `CurrentMhz` 采集。

## Root Cause
- 原实现使用 `sysinfo` 的频率均值，在部分 Windows 机器上更接近静态/基准值，更新不明显。

## Changes
- `src-tauri/src/monitor/service.rs`
  - 新增 Windows 专用频率读取函数：
    - 调用 `CallNtPowerInformation(ProcessorInformation)`
    - 读取 `PROCESSOR_POWER_INFORMATION.CurrentMhz`
    - 按逻辑核求平均作为当前频率
  - 保留兜底：
    - 若系统调用失败，回退到 `sysinfo` 平均频率
- `src-tauri/Cargo.toml`
  - `windows-sys` 新增特性：`Win32_System_Power`

## Result
- CPU 主显示频率会随负载变化动态更新，更接近任务管理器“速度”。
