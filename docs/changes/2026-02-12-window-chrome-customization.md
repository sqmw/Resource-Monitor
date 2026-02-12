# 2026-02-12 改造记录：窗口菜单/标题栏自定义

## 问题

默认系统窗口样式与当前仪表盘视觉不一致，原生标题栏观感割裂，影响整体美观。

## 方案

1. 关闭系统原生窗口装饰：`decorations = false`
2. 新增前端自定义窗口框架组件：
   - 可拖拽区域（`data-tauri-drag-region`）
   - 最小化、最大化、关闭按钮
3. 将页面内容与窗口框架分层，避免页面组件承担窗口控制职责。

## 改动文件

1. `src-tauri/tauri.conf.json`
2. `src/lib/components/window/WindowFrame.svelte`
3. `src/routes/+page.svelte`

## 风险和后续

1. 目前窗口按钮图标使用字符绘制，后续可替换为 SVG 图标体系以统一品牌风格。
2. 如果后续需要“始终置顶/锁定尺寸”等窗口能力，可在 `WindowFrame` 内继续扩展，不影响业务组件。

## 运行期问题修复（权限）

在 Tauri v2 下，自定义标题栏调用窗口 API 需要显式 capability。  
已在 `src-tauri/capabilities/default.json` 增加以下权限：

1. `core:window:allow-start-dragging`
2. `core:window:allow-minimize`
3. `core:window:allow-toggle-maximize`
4. `core:window:allow-is-maximized`
5. `core:window:allow-close`

## 工程校验修复

1. 将 Svelte 事件绑定从 `on:click` 升级为 Svelte 5 推荐的 `onclick`。
2. 为 `src/lib/utils/formatters.js` 和 `src/routes/+page.svelte` 补充 JSDoc 类型，解决 `checkJs` 下的严格校验错误。
3. 校验结果：`pnpm check` 与 `cargo check` 均通过。
