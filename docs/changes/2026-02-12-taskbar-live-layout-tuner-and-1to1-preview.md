# 2026-02-12 Taskbar Live Layout Tuner And 1:1 Preview

## Summary
- 新增任务栏布局实时调节能力，主窗口预览与真实任务栏窗口保持 1:1 还原。
- 同时收紧任务栏默认间距与默认宽度，提升初始体验。

## Changes
- 新增共享配置：`src/lib/config/displayConfig.js`
  - 统一展示窗口尺寸配置（taskbar/floating）
  - 新增任务栏布局默认值（padding/column gap/font size）
- 新增组件：`src/lib/components/dashboard/TaskbarLayoutTuner.svelte`
  - 调整任务栏左右内边距
  - 调整列间距
  - 调整字号
- 调整组件：`src/lib/components/dashboard/TaskbarStrip.svelte`
  - 支持 `layout` 入参并使用 CSS 变量驱动布局
  - 预览与真实窗口共用同一渲染逻辑
- 调整页面：`src/routes/+page.svelte`
  - 新增 `rm.taskbarLayout` 持久化
  - 偏好广播/接收增加 `taskbarLayout`，跨窗口实时同步
  - 主窗口加入 `TaskbarLayoutTuner`
  - 预览容器使用任务栏真实尺寸变量（1:1）
- 调整服务：`src/lib/services/windowModeService.js`
  - 读取共享窗口配置，避免尺寸硬编码分散
- 文案更新：`src/lib/i18n/translations.js`
  - 新增任务栏布局调节文案（中英）

## Result
- 主窗口可直接调任务栏间距与字号，预览和真实显示同步更新。
- 布局不再需要反复手改 CSS，用户可以按个人偏好收紧或放宽。
- 配置可持久化，重启后保留。
