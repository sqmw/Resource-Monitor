# 2026-02-12 Taskbar Group Gap Tuner

## Summary
- 新增任务栏“组间距”调节，专门控制 `CPU值 -> MEM标签` 与 `DL值 -> UL标签` 的横向距离。

## Changes
- `src/lib/config/displayConfig.js`
  - `DEFAULT_TASKBAR_LAYOUT` 新增 `groupGap` 默认值。
- `src/lib/components/dashboard/TaskbarLayoutTuner.svelte`
  - 新增 `groupGap` 滑块与回调。
- `src/lib/components/dashboard/TaskbarStrip.svelte`
  - 新增 CSS 变量 `--rm-group-gap`
  - 第二组标签（`MEM`、`UL`）增加可调左外边距，单独控制组间距。
- `src/routes/+page.svelte`
  - `taskbarLayout` 结构增加 `groupGap`
  - 归一化、持久化、广播同步全部覆盖 `groupGap`
  - 主窗口调节器接入 `onGroupGapChange`
- `src/lib/i18n/translations.js`
  - 新增中英文文案 `taskbarGroupGap`

## Result
- 可以独立微调两组数据间距，不影响标签和值内部间距。
- 主窗口预览与真实任务栏窗口仍保持 1:1 实时同步。
