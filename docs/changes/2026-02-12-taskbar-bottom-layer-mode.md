# 2026-02-12 Taskbar Bottom Layer Mode

## Summary
- 任务栏监视窗口改为“底层锚定”显示策略（always-on-bottom），不再参与置顶/全屏抑制逻辑。
- 目标是对齐 TrafficMonitor 的任务栏嵌入使用感：减少 z-order 抖动导致的发灰/失真感。

## Changes
- `src/lib/services/windowModeService.js`
  - 新增 `setAlwaysOnBottomIfPossible()` 封装。
  - `taskbar` 窗口在显示与策略应用时固定：
    - `alwaysOnBottom = true`
    - `alwaysOnTop = false`
  - `floating` 保持原有 topmost 策略。
  - 进入任务栏手动拖动模式时，临时取消 bottom 锚定以保证交互；退出后恢复 bottom 锚定。

- `src-tauri/src/lib.rs`
  - tray 切换显示窗口时：
    - `taskbar` 显示 => `set_always_on_bottom(true)` + `set_always_on_top(false)`
    - `floating` 显示 => `set_always_on_bottom(false)` + `set_always_on_top(true)`

- `src-tauri/capabilities/default.json`
  - 增加权限：`core:window:allow-set-always-on-bottom`

## Result
- 任务栏窗口层级不再受全屏检测/前景窗口变更影响。
- 任务栏场景优先稳定，避免“像被遮挡一层”的观感波动。
