# 2026-02-12 Taskbar Table Overflow And Row Fit Fix

## Summary
- 修复任务栏条中两行内容被裁切、错位、看起来“乱”的问题。

## Root Cause
- 表格使用了偏大的 `border-spacing` 和外层内边距，在任务栏窗口高度较小时会超出可用空间。
- 超出后 `overflow: hidden` 把上/下行裁掉，形成错位感。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- 调整为“固定两行高度”策略：
  - 表格 `height: 100%`
  - 每行 `height: 50%`
- 收紧尺寸模型：
  - 外层 padding 下调
  - `border-spacing` 减小为仅水平间距
  - 字号和行高下调，保证在任务栏高度内稳定显示
- 列宽与单元格优化：
  - `metric / metric / time` 改为 `40% / 40% / 20%`
  - 指标单元固定标签列宽（`2.8ch`）+ 数值弹性列

## Result
- 两行内容在任务栏窗口内完整可见，不再被裁切。
- 指标与时间列稳定对齐，布局可读性恢复。
