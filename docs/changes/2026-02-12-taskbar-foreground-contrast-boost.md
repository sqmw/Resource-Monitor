# 2026-02-12 Taskbar Foreground Contrast Boost

## Summary
- 强化任务栏监视条前景文字可读性，解决“发灰、发暗、不够突出”问题。

## Changes
- `src/lib/components/dashboard/TaskbarStrip.svelte`
  - 任务栏文本色统一提升到接近纯白。
  - 强化文字阴影边界，提升亮背景下轮廓可读性。
  - 移除会导致视觉发灰的文本描边（`-webkit-text-stroke`）。
  - 区分标签与数值字重：数值更粗，信息层次更清晰。
  - 时间字段同步提升亮度。

## Result
- 任务栏模式下前景文字更“跳出”，在透明背景和复杂桌面下更清晰。
