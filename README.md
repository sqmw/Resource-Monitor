# Resource Monitor (Rust Rewrite for TrafficMonitor)

使用 Rust + Tauri + Svelte 重写 TrafficMonitor，目标是提升安全性、可维护性和 UI 可定制能力。

## 当前进度

- 已完成第一阶段骨架：
  - Rust 侧监控采集服务（CPU/内存/网络吞吐）
  - Tauri 命令白名单式暴露（无 opener 插件权限）
  - 前端高颜值可主题化仪表盘（Aurora/Ember/Forest）
  - 全局 CSS Reset（移除默认样式影响）
- 已完成持续优化：
  - 单位标准统一为 SI（`B/KB/MB/GB/TB`）
  - 默认窗口与仪表盘布局改为紧凑模式（减少外层包裹感）
  - 增加中英文切换并持久化
  - 增加任务栏嵌入模式（纯信息条 + 双击退出 + 窗口置顶贴边）
  - 增加窗口布局持久化（模式、尺寸、高度拟合、位置、任务栏目标屏）
  - 增加系统托盘入口并隐藏任务栏图标（`skipTaskbar`）
  - 重构为三窗口架构：主窗口控制台 + 任务栏展示 + 悬浮窗展示（可共存）
  - 支持“复制当前展示模式到下一块屏幕”并持久化布局
  - 主窗口支持实时预览，主题/语言调整即时同步到展示窗口
  - 监测指标扩展：交换内存、磁盘占用、进程数、系统运行时长、网络速率峰值

## 开发命令

```bash
pnpm install
pnpm tauri dev
```

## 文档

- 架构说明：`docs/architecture/phase-1-overview.md`
- 本次改造记录：`docs/changes/2026-02-12-phase-1-bootstrap.md`
- 窗口自定义记录：`docs/changes/2026-02-12-window-chrome-customization.md`
- 单位与紧凑化优化：`docs/changes/2026-02-12-unit-and-compact-optimization.md`
- i18n 与任务栏模式：`docs/changes/2026-02-12-i18n-taskbar-embed-and-density.md`
- 任务栏模式重做：`docs/changes/2026-02-12-taskbar-mode-redesign.md`
- 布局持久化与多屏恢复：`docs/changes/2026-02-12-layout-persistence-and-multimonitor.md`
- 系统托盘与任务栏隐藏：`docs/changes/2026-02-12-system-tray-and-skip-taskbar.md`
- 主窗口控制台与展示窗口重构：`docs/changes/2026-02-12-control-window-and-display-modes.md`
