# 2026-02-12 Taskbar Text Force High Contrast

## Summary
- 修复任务栏监视条文字“发灰、不清晰”的问题。
- 任务栏模式下改为始终使用高对比亮色文本，不再切换到暗色文字。

## Changes
- `src/lib/components/dashboard/TaskbarStrip.svelte`
  - 移除任务栏条 `auto-dark/auto-light` 的分支依赖。
  - 自动对比模式下统一采用高亮文本（纯亮色）+ 强阴影 + 轻描边。
  - 提高任务栏文字字重，增强可读性。
  - 自动对比模式下对背景做稳定化处理：
    - 透明度设置温和下限，避免背景过透导致忽明忽暗，同时保留透明感。
    - 毛玻璃限制为轻量范围，减少亮度波动，同时保留磨砂效果。
  - 当透明度为 `0` 时强制关闭毛玻璃，保证“完全透明”语义成立。

- `src/routes/+page.svelte`
  - `refreshDisplayContrastTone()` 在任务栏窗口下固定 `displayContrastTone="light"`，不再按背景亮度切换暗色文本。

## Result
- 任务栏条在各种壁纸/任务栏背景下保持稳定清晰，不再出现“整体变灰像被遮挡”的视觉表现。
