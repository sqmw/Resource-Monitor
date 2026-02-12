# 2026-02-12 Taskbar Vertical Alignment

## Summary
- 修复任务栏两行指标“纵向未对齐”问题。
- 目标是标签对齐、数字对齐，并在数值变化时保持布局稳定。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- 将指标文本从单字符串改为结构化布局：
  - `metric-label`（CPU/MEM/DL/UL）
  - `metric-value`（对应实时值）
- 每个指标单元使用统一双列网格：`3ch + 1fr`，保证标签列宽固定。
- 上下两行复用同样的三列主网格，保证跨行纵向对齐。
- 时间列改为右对齐，减少视觉飘移。

## Result
- CPU/DL、MEM/UL 在垂直方向严格对齐。
- 标签与数值分别形成稳定列，不再出现“标签挤占数字”导致的错位。
- 数字变化时整体布局更稳，阅读路径更清晰。
