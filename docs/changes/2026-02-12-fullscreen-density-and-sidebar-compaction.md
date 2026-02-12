# 2026-02-12 Fullscreen Density And Sidebar Compaction

## Summary
- 优化全屏场景下“底部空白大、右侧设置栏过高、信息密度偏低”的问题。

## Changes
- 文件：`src/routes/+page.svelte`
- 主内容区改为纵向弹性布局：
  - `main-content` 从 `grid` 改为 `flex-column`
  - `preview` 设置为 `flex: 1`，自动吃掉剩余高度
- 右侧设置栏紧凑化：
  - 设置 `align-self: start`，不再整列拉伸占满高度
  - 增加 `max-height`，超长时内部滚动
- 全屏密度提升：
  - 超宽屏（`min-width: 1580px`）卡片区自动 3 列
- 小屏回退保持可用：
  - 单列时维持设置区在后、预览不强制拉伸

## Result
- 主窗口全屏时空白显著减少。
- 设置侧栏视觉重心更稳，不再“又高又空”。
- 数据区在大分辨率下更紧凑、更高效。
