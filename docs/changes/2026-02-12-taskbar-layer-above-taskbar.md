# 2026-02-12 Taskbar Layer Above Taskbar

## Summary
- 任务栏监视窗口改为“任务栏上层可见，但不全局压顶”。
- 在普通桌面场景保持任务栏上层；当前景全屏时自动让出层级。

## Changes
- `src/lib/services/windowModeService.js`
  - 保留 `applyTaskbarLayer()` 作为交互期（拖动定位）强置顶工具。
  - 新增 `applyTaskbarTopmostPolicy()`：
    - `setAlwaysOnBottom(false)`
    - 根据策略决定 `setAlwaysOnTop(...)`：
      - `always` => `true`
      - `manual` => `false`
      - `auto` => 非全屏 `true`，全屏 `false`
  - taskbar 窗口在显示、失焦、策略轮询、拖动模式切换时统一复用该策略。

- `src-tauri/src/lib.rs`
  - tray 中显示 taskbar 窗口时，改为：
    - `set_always_on_bottom(false)`
    - 初始 `set_always_on_top(false)`，由前端策略接管后续层级判定。

## Result
- 非全屏：任务栏监视窗口保持任务栏上层可见。
- 全屏：任务栏监视窗口自动不置顶，不会压住全屏应用。
