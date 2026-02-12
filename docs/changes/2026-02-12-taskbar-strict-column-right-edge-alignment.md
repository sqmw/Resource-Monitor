# 2026-02-12 Taskbar Strict Column Right-Edge Alignment

## Summary
- 进一步修正任务栏数值对齐逻辑，确保“同一列数值右边界”为同一坐标。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- `.metric-value` 从内容宽度对齐改为列宽度对齐：
  - `justify-self: stretch`
  - `width: 100%`
  - `text-align: right`

## Result
- 同一列上下两行数值右边界严格一致。
- 不再出现“看似靠右但实际按内容宽度错位”的问题。
