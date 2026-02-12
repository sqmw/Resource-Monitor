# 2026-02-12 Taskbar Clarity and Topmost Stability

## Summary
- 修复任务栏监视窗口偶发“文字变暗、像被遮挡”的可读性问题。
- 修复任务栏窗口在 `auto` 置顶策略下可能被错误降级 z-order 的问题。

## Root Cause
- 任务栏条在 `textContrastMode=auto` 且检测到亮背景时，会进入 `auto-dark` 分支，文本颜色过暗。
- `auto` 置顶策略的全屏抑制逻辑对任务栏条不合适，任务栏展示更需要稳定保持顶层。

## Changes
- `src/lib/components/dashboard/TaskbarStrip.svelte`
  - 调整 `auto-dark` 配色：仍使用高亮文本，强化暗色阴影轮廓，避免“整体发灰变暗”。

- `src/lib/services/windowModeService.js`
  - 在 `initDisplayWindowLayoutPersistence("taskbar")` 中：
    - `auto` 策略下不再走全屏抑制分支。
    - 改为持续确保任务栏窗口 `alwaysOnTop=true`。
  - `onFocusChanged` 时，若为任务栏+`auto` 策略，失焦后立即重申顶层。
  - `setAutoTopmostState(true)` 调整为直接 `setAlwaysOnTop(true)`，避免高频 toggle 带来视觉副作用。

## Result
- 任务栏模式文字不再出现明显发暗/发灰。
- 任务栏窗口在常规桌面使用中保持稳定 z-order，不再像被覆盖一层。
