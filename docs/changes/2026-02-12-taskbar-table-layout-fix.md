# 2026-02-12 Taskbar Table Layout Fix

## Summary
- 修复任务栏 `table` 版本出现的错位、粘连和可读性下降问题。

## Changes
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- 为表格添加 `colgroup`，明确 5 列语义宽度：
  - 标签列（窄）
  - 数值列（弹性）
  - 标签列（窄）
  - 数值列（弹性）
  - 时间列（固定）
- 使用 `border-collapse: separate` + `border-spacing` 控制列间距，避免文本连在一起。
- 移除不合理的 `td width: 32%` 方案，改为列级宽度控制。
- 调整字体和行高，恢复可读性。

## Result
- 两行指标在同列下稳定对齐。
- 时间列独立，不再与前一列粘连。
- 在可用空间足够时不再出现异常挤压。
