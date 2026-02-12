# 2026-02-12 Taskbar Two-Row Grid Root Fix

## Summary
- 从结构层修复任务栏显示异常：强制固定为两行，不再依赖 `table` 自动排版。

## Root Cause
- `table` 在受限高度窗口中的自动布局与间距策略容易触发行高挤压和裁切，造成看起来像“三行/错位”。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- 布局从 `table` 重构为显式网格：
  - `grid-template-columns: max-content 1fr max-content 1fr 8ch`
  - `grid-template-rows: 1fr 1fr`
  - 固定 2 行 5 列（标签1/值1/标签2/值2/时间）
- 保持对齐规则：
  - 标签列左对齐
  - 数值列右对齐并可省略
  - 时间列固定右对齐

## Result
- 任务栏模式稳定保持两行显示。
- 对齐规则稳定，不再出现自动表格布局导致的错乱。
