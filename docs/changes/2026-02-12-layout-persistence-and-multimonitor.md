# 2026-02-12 改造记录：布局持久化与多屏恢复

## 目标

确保用户设置在重启后不丢失，尤其是窗口相关设置：

1. 视图模式（仪表盘/任务栏）
2. 仪表盘窗口位置与高度
3. 任务栏模式所处屏幕

## 关键实现

### 1) 窗口布局存储

- 文件：`src/lib/services/windowModeService.js`
- 新增本地存储键：`rm.window.layout.v1`
- 存储内容：
  1. `dashboard.width/height/x/y`
  2. `taskbar.monitorName`

### 2) 自动记录窗口几何变化

- 文件：`src/lib/services/windowModeService.js`
- 新增 `initWindowLayoutPersistence()`：
  1. 监听 `onMoved` 记录仪表盘位置
  2. 监听 `onResized` 记录仪表盘高度
  3. 返回 cleanup 函数用于页面卸载时释放监听

### 3) 启动/切换时恢复布局

- 文件：`src/lib/services/windowModeService.js`
- `applyWindowMode("dashboard")`：
  1. 先恢复尺寸
  2. 若存储位置仍在可视屏幕范围内则恢复位置
- `applyWindowMode("taskbar")`：
  1. 优先使用持久化的 `monitorName`
  2. 在对应屏幕右下角贴边显示

### 4) 页面挂载持久化监听

- 文件：`src/routes/+page.svelte`
- 在 `onMount` 注册 `initWindowLayoutPersistence()` 并在销毁时 cleanup。

### 5) 权限补齐

- 文件：`src-tauri/capabilities/default.json`
- 增加：`core:window:allow-available-monitors`

## 结果

1. 模式与窗口布局在重启后可恢复。
2. 多显示器环境下，任务栏模式能尽量回到上次目标屏幕。
3. 屏幕拓扑变化时，使用可视区校验避免窗口恢复到不可见区域。
4. 任务栏模式支持手动定位：
   - 托盘开启定位编辑后可拖动与方向键微调
   - 手动位置和尺寸同样持久化并跨重启恢复
