# 2026-02-12 Preview Overstretch Regression Fix

## Summary
- 修复主窗口全屏时“样式预览区异常拉伸、占据大面积空白”的回归问题。

## Root Cause
- 上一版将 `.preview` 设为 `flex: 1`，导致其在全屏场景吞噬剩余高度。

## Changes
- 文件：`src/routes/+page.svelte`
- `main-content` 从 `flex-column` 改为固定四行 `grid`。
- 移除 `.preview` 的拉伸行为，改为固定紧凑最小高度。
- 预览内容容器保持顶部对齐，避免视觉下沉。

## Result
- 全屏时不再出现巨大的预览空白块。
- 页面密度恢复正常，信息区与预览区比例更合理。
