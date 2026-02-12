# 2026-02-12 Taskbar Value Start Alignment By Label Max Width

## Summary
- 按“标签列最大自然宽度”确定数值起始位置，修正任务栏指标对齐策略。

## Alignment Rule
- 每个指标列拆为：
  - 标签列（`max-content`，自动取该列最大标签宽）
  - 数值列（`minmax(0, 1fr)`）
- 数值采用左对齐，保证“开始位置”在同列内一致。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- 将 `.metric-value` 从右对齐改为左对齐：
  - `text-align: left`

## Result
- 标签对齐保持不变。
- 每列数字从同一起点开始，符合“前列标签最大宽度后再起数值”的要求。
