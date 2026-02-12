# 2026-02-12 改造记录：单位修正与紧凑化重构

## 问题摘要

1. 内存指标显示异常放大，出现 TB 级错误。
2. 默认窗口和页面外层留白过大，监控信息密度偏低。

## 根因分析

1. 后端内存值被重复换算：
   - `system.used_memory()` 与 `system.total_memory()` 结果又乘以 `1024`，导致放大。
2. UI 尺寸策略偏“展示型”：
   - 窗口最小宽高过大，内容边距和标题区占比高，形成“外层包裹感”。

## 改动明细

### 1. 后端单位修正（根治）

- 文件：`src-tauri/src/monitor/service.rs`
- 调整：
  - `memory_used_bytes` 去掉 `* 1024`
  - `memory_total_bytes` 去掉 `* 1024`

### 2. 前端单位规范改为 SI

- 文件：`src/lib/utils/formatters.js`
- 调整：
  - 单位统一为 `KB/MB/GB/TB`
  - 保持 `formatRate` 输出 `${formatBytes(...)}/s`，自动得到 `KB/s`、`MB/s`
  - 新增任务栏紧凑显示：大于 1000 自动缩写为 `K`，大于 1000K 缩写为 `M`，再上为 `G`

### 3. 窗口尺寸改为自适应紧凑

- 文件：`src-tauri/tauri.conf.json`
- 调整：
  - `width`: `1120 -> 980`
  - `height`: `760 -> 680`
  - `minWidth`: `980 -> 760`
  - `minHeight`: `640 -> 520`

### 4. 页面与组件紧凑化

- 文件：`src/routes/+page.svelte`
  - 外层 `padding`、内容 `padding`、标题区和网格间距收敛
  - 仪表盘最大宽度收敛（减少大包裹感）
- 文件：`src/lib/components/window/WindowFrame.svelte`
  - 标题栏高度与按钮宽度下调
- 文件：`src/lib/components/dashboard/StatTile.svelte`
  - 卡片内边距、圆角、字体层级收敛
- 文件：`src/lib/components/dashboard/ProgressTrack.svelte`
  - 进度块间距和字体缩小，条高下调

## 验证结果

1. `pnpm check` 通过。
2. `cargo check` 通过。

## 验收关注点

1. 内存总量应回到 GiB 量级，不再出现 TB 级误报。
2. 默认窗口首屏信息更聚焦，无明显外层空壳。
3. 拖拽与窗口按钮能力不回归（自定义标题栏可用）。

## 后续微调：去除外层舞台包裹

根据 UI 反馈，移除页面“居中舞台背景层”，让主面板贴满窗口：

1. 删除 `+page.svelte` 中的 `.bg` 背景装饰层。
2. `page` 改为全宽高容器，不再 `place-items:center`。
3. `dashboard` 改为 `width:100%` + `min-height:100vh`，取消外层圆角与边框。

效果：红框外区域不再形成独立可见包裹层，界面主体与窗口边界一致。

## 继续优化：紧凑回归与命名统一

针对“界面不够紧致、观感下降”的反馈，做了两项修正：

1. 紧凑性修正：
   - `src/routes/+page.svelte` 的 `.content` 增加 `grid-auto-rows: max-content` 与 `align-content: start`，
     解决窗口高度增加时网格行被拉开导致的大面积空白问题。
   - 页面容器改为固定 `height: 100vh` 并收敛间距，避免额外滚动与松散布局。

2. 命名统一：
   - 窗口标题、自定义标题栏和主标题统一为 `resource_monitor`。
   - 变更文件：
     - `src-tauri/tauri.conf.json`
     - `src/routes/+page.svelte`
