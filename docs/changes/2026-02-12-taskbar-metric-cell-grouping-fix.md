# 2026-02-12 Taskbar Metric Cell Grouping Fix

## Summary
- 修复任务栏中“CPU 数值靠近 MEM、MEM 显示不全”的结构性问题。

## Root Cause
- 之前将标签和值拆成独立列，导致视觉上出现跨列串位。
- 当空间压缩时，标签和值可能看起来不属于同一指标。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- 将每个指标改为“单元格内成对布局”：
  - `CPU + value`
  - `MEM + value`
  - `DL + value`
  - `UL + value`
- 表格列改为三列：`metric / metric / time`，两行复用同列宽。
- 指标单元内部使用双列网格（`label + value`），保证数值紧跟对应标签。

## Result
- CPU 数值只会跟在 CPU 后面，不再靠到 MEM。
- MEM、UL 等显示稳定性提升。
- 纵向列对齐和可读性同时满足。
