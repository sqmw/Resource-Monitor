# 2026-02-12 Main Window Initial Size and Restore

## Summary
- 修复首启主窗口宽度不足导致右侧控制栏掉到下方的问题。
- 新增主窗口尺寸/位置持久化，保证下次启动恢复上次关闭时状态。

## Changes
- `src-tauri/tauri.conf.json`
  - 主窗口默认尺寸调整为 `1140x720`
  - 主窗口最小尺寸调整为 `1100x620`
  - 确保首启即满足“右侧控制栏保持在右侧”的最小正常布局

- `src/lib/services/mainWindowStateService.js`（新增）
  - `restoreMainWindowLayout()`
    - 启动时读取 `rm.mainWindow.layout.v1`
    - 按当前显示器边界进行位置和尺寸钳制（多屏安全）
  - `initMainWindowLayoutPersistence()`
    - 监听主窗口 `onMoved/onResized`
    - 实时保存最新 `x/y/width/height`
    - 最大化状态不覆盖普通窗口布局

- `src/routes/+page.svelte`
  - 主窗口分支接入：
    - 启动先恢复主窗口布局
    - 再同步展示窗口、置顶策略、穿透策略与偏好广播
  - 注册并释放主窗口布局持久化监听

## Result
- 安装后第一次启动主窗口默认即可并排展示右侧控制栏。
- 后续每次启动恢复上次关闭前主窗口尺寸和位置。
