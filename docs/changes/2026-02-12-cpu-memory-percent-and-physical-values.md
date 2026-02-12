# 2026-02-12 CPU Memory Percent And Physical Values

## Summary
- 按“百分比 + 物理量”统一展示 CPU/内存/交换区/磁盘。

## Changes
- 后端采集字段扩展：
  - `src-tauri/src/monitor/models.rs`
    - `cpu_logical_cores`
    - `cpu_frequency_mhz`
  - `src-tauri/src/monitor/service.rs`
    - 采集 CPU 逻辑核数与平均频率（MHz）
- 前端类型同步：
  - `src/lib/types/monitor.d.ts`
- 新增格式化：
  - `src/lib/utils/formatters.js`
    - `formatCpuFrequency(mhz)` -> `GHz`
- 页面展示重构：
  - `src/routes/+page.svelte`
    - CPU 卡片：主值=占用率%，副文案=频率 + 逻辑核
    - 内存/交换区/磁盘卡片：主值=占用率%，副文案=已用/总量（物理量）
- 文案补充：
  - `src/lib/i18n/translations.js`
    - `cpuCores`
    - `cpuFrequency`

## Result
- 关键资源统一具备“比例 + 实际量”信息，不再只显示单一维度。
