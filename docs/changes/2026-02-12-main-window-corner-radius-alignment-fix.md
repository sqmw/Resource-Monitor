# 2026-02-12 Main Window Corner Radius Alignment Fix

## Summary
- 修复主窗口左上角边角缝隙/切角异常。

## Root Cause
- 标题栏圆角半径（`28px`）与主容器圆角（`14px`）不一致，叠层抗锯齿下产生边角瑕疵。

## Changes
- 文件：`src/lib/components/window/WindowFrame.svelte`
  - 标题栏圆角由 `28px` 调整为 `14px`（与主容器一致）
  - 增加 `overflow: hidden`，确保标题栏背景不越界

## Result
- 主窗口四角视觉一致，左上角不再出现异常缝隙。
