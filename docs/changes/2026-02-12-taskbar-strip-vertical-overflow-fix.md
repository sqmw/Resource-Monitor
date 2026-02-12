# 2026-02-12 Taskbar Strip Vertical Overflow Fix

## Summary
- 修复任务栏展示条出现“顶部留白、底部文字溢出”的垂直对齐问题。

## Root Cause
- 任务栏布局中的 `paddingY` 会从历史本地存储恢复。
- 旧版本可写入较大的 `paddingY`，而当前设置面板未提供该项调整入口，导致异常值长期保留并影响布局。

## Changes
- `src/routes/+page.svelte`
  - 收紧 `normalizeTaskbarLayout()` 中 `paddingY` 的合法范围到 `0..4`，自动迁移旧的异常值。
- `src/lib/config/displayConfig.js`
  - 任务栏默认 `paddingY` 从 `3` 调整为 `2`，缩短垂直冗余。
- `src/lib/components/dashboard/TaskbarStrip.svelte`
  - `paddingY` 样式钳制同步改为 `0..4`
  - 去掉 `min-height: 54px`，改为 `min-height: 0`
  - 根容器改为 `display: flex; align-items: center;`
  - 指标网格改为高度自适应并垂直居中，行间距细化
  - 文本 `line-height` 收敛，避免第二行底部被裁剪

## Result
- 任务栏条在固定高度窗口中可保持上下对齐，避免顶部空隙和底部溢出。
