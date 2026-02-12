# 2026-02-12 Display Window Text Contrast Mode Toggle

## Summary
- 新增展示窗口文字对比模式开关：`Auto` / `Fixed`。
- 仅作用于任务栏窗口与悬浮窗口，不影响主控制窗口。

## Changes
- 新增组件：`src/lib/components/dashboard/TextContrastPicker.svelte`
  - 用于切换文字对比模式。
- 页面接入：`src/routes/+page.svelte`
  - 新增状态 `textContrastMode`
  - 持久化键：`rm.textContrastMode`
  - 偏好广播同步到其它窗口
  - 在设置区加入对比模式切换按钮
  - 将模式传递给 `TaskbarStrip` 与 `FloatingPanel`（预览 + 真实展示窗口）
- 文案新增：`src/lib/i18n/translations.js`
  - `textContrastAuto`
  - `textContrastFixed`

## Result
- `Auto`：根据底色自动反差，提升复杂背景下可读性。
- `Fixed`：使用固定文本样式，避免混合模式带来的视觉变化。
