# 2026-02-12 Taskbar Value Right Alignment

## Summary
- 修复任务栏两行指标中“标签对齐但数值未对齐”的问题。
- 按同列最右边界对齐数值，保证 CPU/DL、MEM/UL 纵向一致。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- `metric` 单元保持双列网格（标签 + 数值），新增 `min-width: 0` 防止异常溢出。
- 将 `.metric-value` 从左对齐改为右对齐：
  - `justify-self: end`
  - `text-align: right`
  - `min-width: 0`

## Result
- 每列的数值都以该列右边界对齐。
- 上下两行读取路径一致，视觉上更像表格列。
