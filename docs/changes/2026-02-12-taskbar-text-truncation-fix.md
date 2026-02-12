# 2026-02-12 Taskbar Text Truncation Fix

## Summary
- 修复任务栏信息条中“空间足够但标签/数值被省略号截断”的问题。
- 保持纵向对齐前提下，优先保证标签完整显示。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- 调整主网格列宽：
  - 从 `1fr 1fr 112px` 改为 `1.15fr 1.15fr minmax(96px, auto)`。
  - 时间列保留最小宽度但允许自适应扩展。
- 调整指标单元网格：
  - 从 `3ch + 1fr` 改为 `auto + 1fr`，避免 `CPU/MEM` 标签被硬截断。
- 调整溢出策略：
  - 移除 `p` 层全局省略号。
  - 仅对 `.metric-value` 启用省略号，标签保持完整显示。

## Result
- CPU/MEM/DL/UL 标签不再出现 `C...` / `M...`。
- 数值在可用空间内优先显示完整，超出时仅数值部分收敛。
- 纵向列对齐保持不变。
