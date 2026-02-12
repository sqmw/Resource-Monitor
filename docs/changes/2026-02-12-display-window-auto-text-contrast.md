# 2026-02-12 Display Window Auto Text Contrast

## Summary
- 为任务栏窗口与悬浮窗口新增自动前景对比模式（默认 `auto`），提升被复杂背景遮挡时的文字可读性。

## Scope
- 仅作用于展示窗口：
  - `TaskbarStrip`
  - `FloatingPanel`
- 不改主控制窗口的文字风格。

## Changes
- `src/lib/components/dashboard/TaskbarStrip.svelte`
  - 新增 `textContrastMode`（默认 `auto`）
  - `auto` 下文本启用 `mix-blend-mode: difference` + 轻微 `drop-shadow`，按底色自动形成反差
- `src/lib/components/dashboard/FloatingPanel.svelte`
  - 同步新增 `textContrastMode`（默认 `auto`）
  - 对标题、时间、指标文本应用同样的自动对比策略

## Result
- 任务栏条和悬浮窗在不同桌面/窗口背景下可读性更稳定。
