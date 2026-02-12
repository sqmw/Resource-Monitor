# 2026-02-12 Taskbar Layer Regression Fix (Tray + Drag Path)

## Summary
- 修复任务栏窗口偶发掉到任务栏下层的问题。
- 本次修复对齐 `TrafficMonitor` 的核心原则：任务栏展示窗优先保持稳定可见层级，不走普通悬浮窗的置顶分支。

## Root Cause
- `src-tauri/src/lib.rs` 的 tray 显示任务栏窗口路径中，误将任务栏窗口设为 `always_on_top(false)`。
- `src/lib/services/windowModeService.js` 的任务栏拖动路径复用了普通 `applyTopmostPolicy()`，导致任务栏窗口在手动策略等场景被降级。

## Changes
- `src-tauri/src/lib.rs`
  - `toggle_display_window(..., "taskbar")` 显示时改为：
    - `set_always_on_bottom(false)`
    - `set_always_on_top(true)`

- `src/lib/services/windowModeService.js`
  - `startDisplayManualDrag("taskbar")`：
    - 仅走 `applyTaskbarLayer()`，不再走普通 `applyTopmostPolicy()`。
  - `setDisplayManualPositioning("taskbar", true)`：
    - 启用定位时仅走 `applyTaskbarLayer()`，避免错误套用悬浮窗策略。

## Validation
- `pnpm check` 通过。
- `cargo check` 通过。

