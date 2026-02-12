# 2026-02-12 CPU Primary Frequency Display

## Summary
- 调整 CPU 卡片信息层级：主值显示当前频率，副文案显示占用率与逻辑核。

## Changes
- 文件：`src/routes/+page.svelte`
- CPU 卡片：
  - `value`：`formatCpuFrequency(cpuFrequencyMhz)`
  - `subtitle`：`CPU 占用率 xx% · 逻辑核 n`

## Result
- CPU 卡片优先展示“当前频率”这一物理量。
- 占用率仍保留在副文案中，信息完整且更符合监控直觉。
