# 2026-02-12 Main Window Layout Reset Action

## Summary
- 主窗口控制区新增“重置主窗口布局”按钮。
- 一键清除持久化布局，并立即恢复默认尺寸与居中位置。

## Changes
- `src/lib/services/mainWindowStateService.js`
  - 新增 `resetMainWindowLayout()`
  - 行为：
    - 清理 `rm.mainWindow.layout.v1`
    - 按默认尺寸 `1140x720` 计算
    - 按当前屏幕居中放置
    - 写回新的布局基线

- `src/routes/+page.svelte`
  - 主窗口控制区新增按钮调用 `resetMainLayout()`

- `src/lib/i18n/translations.js`
  - 新增文案键：
    - `resetMainLayout`（中文/英文）

## Result
- 当用户将主窗口拖到不理想尺寸/位置时，可快速恢复到稳定初始布局。
