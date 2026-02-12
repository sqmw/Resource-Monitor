# 2026-02-12 Taskbar Default Width Tightening

## Summary
- 收紧任务栏模式默认宽度，避免首次展示过宽影响观感和可用性。

## Changes
- `src/lib/services/windowModeService.js`
  - `taskbar.width`: `560 -> 500`
  - `taskbar.minWidth`: `520 -> 460`
- `src-tauri/tauri.conf.json`
  - `taskbar.width`: `560 -> 500`
  - `taskbar.minWidth`: `520 -> 460`

## Result
- 新启动与重置布局时，任务栏条更紧凑。
- 仍保留足够最小宽度，避免关键指标过度截断。
