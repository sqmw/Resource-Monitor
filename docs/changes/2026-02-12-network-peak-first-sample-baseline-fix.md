# 2026-02-12 Network Peak First Sample Baseline Fix

## Summary
- 修复上传/下载峰值误显示为累计量的问题。

## Root Cause
- 首次采样时 `last_total` 为 0，导致 `delta = total`，被当作瞬时速率并写入峰值。

## Changes
- 文件：`src-tauri/src/monitor/service.rs`
- 在 `collect_network()` 中增加首次采样基线逻辑：
  - 第一次仅记录 `last_received_total` / `last_transmitted_total` / `last_collected_at`
  - 首次返回速率为 `0`
  - 不更新峰值

## Result
- 峰值基于真实相邻采样增量计算，不再等于累计上传/下载量。
