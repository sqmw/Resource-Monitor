# 2026-02-12 Display Windows Decouple and Positioning Sync

## Summary
- 修复自动置顶策略对弹窗场景的误判抖动问题。
- 任务栏窗口与悬浮窗窗口改为互不互斥，可独立显示/隐藏。
- 拖动定位模式扩展为同时作用于任务栏与悬浮窗窗口。

## Problems
1. 前景弹窗会触发短暂误判，导致展示窗口被降级到底层，退出后恢复不稳定。
2. 托盘菜单切换任务栏/悬浮窗时互相隐藏，不符合“可共存”预期。
3. 拖动模式仅绑定任务栏窗口，悬浮窗无法进入同一定位流程。

## Changes

### 1) Auto Topmost 稳定化
- 文件：`src/lib/services/windowModeService.js`
- 调整：
  - `applyTopmostPolicy()` 在 `auto` 模式下默认保持 `always on top`。
  - 全屏抑制统一由守卫轮询负责，使用进入/退出阈值（hysteresis）避免弹窗误判造成频繁闪烁。
- 结果：
  - 临时弹窗不再立即把展示窗口“压下去”。
  - 全屏场景仍可在稳定检测后抑制顶层，恢复时自动回到顶层。

### 2) Tray 菜单改为独立切换显示
- 文件：`src-tauri/src/lib.rs`
- 调整：
  - 删除原先“切任务栏就隐藏悬浮窗”的互斥逻辑。
  - 新增 `toggle_display_window()`：对 `taskbar` 或 `floating` 单独切换显示状态。
  - Tray 菜单文案改为动态状态：
    - `显示任务栏窗口` / `隐藏任务栏窗口`
    - `显示悬浮窗窗口` / `隐藏悬浮窗窗口`
    文案会随当前可见状态实时刷新。
  - 每次切换后发出 `app://display-visibility` 事件同步前端状态。
- 结果：
  - 两个展示窗口可同时显示、可单独隐藏，互不冲突。

### 3) 拖动定位模式广播到全部展示窗口
- 文件：`src-tauri/src/lib.rs`、`src/routes/+page.svelte`、`src/lib/services/windowModeService.js`
- 调整：
  - Tray 新事件：`tray://display-positioning`（保留旧事件兼容）。
  - 任务栏窗口与悬浮窗窗口都监听定位开关，并调用统一接口：
    - `setDisplayManualPositioning(role, enabled)`
    - `startDisplayManualDrag(role)`
    - `nudgeDisplayPosition(role, dx, dy)`
  - 悬浮窗在定位模式下增加拖动层，支持鼠标拖动与方向键微调。
- 结果：
  - 启动拖动模式后，不论当前是任务栏还是悬浮窗，都能进入同一定位体验。

## Validation
- `pnpm check` 通过（0 errors, 0 warnings）
- `cargo check` 通过
