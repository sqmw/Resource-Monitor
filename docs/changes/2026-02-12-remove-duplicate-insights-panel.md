# 2026-02-12 Remove Duplicate Insights Panel

## Summary
- 移除与现有卡片/进度条重复的洞察模块，恢复信息去重。

## Changes
- `src/routes/+page.svelte`
  - 删除 `InsightsPanel` 导入与渲染
  - 删除仅用于该模块的派生变量（`diskPercent`）
- `src/lib/i18n/translations.js`
  - 清理洞察模块新增的冗余文案键
- 删除文件：`src/lib/components/dashboard/InsightsPanel.svelte`
- 删除旧记录并改为本次修正记录

## Result
- 页面回到“单一信息源”展示，不再重复输出相同指标。
- 结构更简洁，后续新增功能将以非重复信息为原则。
