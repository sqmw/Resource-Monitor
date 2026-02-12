# 2026-02-12 Taskbar Shared Column Grid Alignment

## Summary
- 将任务栏两行指标改为“共享列模板”布局，修复跨行自然列宽不一致导致的对齐偏差。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- 结构调整为两行统一 5 列：
  - `label1 / value1 / label2 / value2 / time`
- 列模板统一为：
  - `max-content minmax(0, 1fr) max-content minmax(0, 1fr) max-content`
- 第二行时间位改为占位文本（隐藏）以锁定时间列宽。

## Result
- 同一列标签宽度按自然最大值统一。
- 同一列数值右边界严格一致。
- 时间列在上下两行保持同一右边界，不再扰动前四列。
