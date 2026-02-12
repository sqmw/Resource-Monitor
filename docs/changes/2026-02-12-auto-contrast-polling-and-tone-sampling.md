# 2026-02-12 Auto Contrast Polling and Tone Sampling

## Summary
- 展示窗口（任务栏 / 悬浮窗）的自动文字对比改为“周期采样 + 明暗切换”。
- 自动模式下每隔固定时间轮询一次当前窗口周边屏幕亮度，适配壁纸或背景变化。

## Why
- 仅依赖静态样式时，桌面壁纸变化后可读性不稳定。
- 需要一个可持续刷新、可跨多屏坐标工作的自动对比策略。

## Changes
- 新增 Rust 命令：`sample_backdrop_luminance`
  - 文件：`src-tauri/src/window_contrast.rs`
  - 基于 Windows GDI 采样当前窗口外围 8 个点亮度，返回平均亮度值（0~255）
  - 使用虚拟桌面坐标（支持多屏）
- 接入命令到 Tauri invoke
  - 文件：`src-tauri/src/lib.rs`
- 新增前端服务：`src/lib/services/contrastService.js`
  - `sampleCurrentWindowBackdropLuminance()`
  - `resolveContrastTone()`（含阈值滞回，避免明暗抖动）
  - `AUTO_CONTRAST_POLL_MS`（默认 2600ms）
- 页面轮询与同步
  - 文件：`src/routes/+page.svelte`
  - 在任务栏/悬浮窗窗口中周期轮询并更新 `displayContrastTone`
  - 窗口移动/缩放后立即重采样
- 展示组件改造
  - 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
  - 文件：`src/lib/components/dashboard/FloatingPanel.svelte`
  - 自动模式按 `light/dark` 切换文本色与阴影，并用刷新 tick 触发重绘

## Result
- 任务栏与悬浮窗在桌面背景变化后能自动重新判定文字明暗，整体可读性更稳定。
