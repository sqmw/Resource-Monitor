# 2026-02-12 改造记录：任务栏模式重做（纯信息条）

## 问题

原任务栏模式仍保留完整标题栏和控制区，本质是“压扁窗口”，不符合任务栏嵌入预期。

## 目标

1. 任务栏模式仅显示单行监控信息。
2. 不显示标题栏和主题/语言/模式控件。
3. 双击信息条可切回仪表盘模式。

## 核心改动

### 1) 页面结构按模式分离

- 文件：`src/routes/+page.svelte`
- 调整：
  1. `dashboard` 模式才渲染 `WindowFrame`
  2. `taskbar` 模式仅渲染 `TaskbarStrip`
  3. 移除任务栏模式下的控制区
  4. 新增 `exitTaskbarMode`，通过双击条形区切回 `dashboard`

### 2) TaskbarStrip 纯净化

- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
- 调整：
  1. 移除标题文案
  2. 保留 `CPU/MEM/DL/UL/time` 指标
  3. 新增 `onDoubleClick` 回调并绑定 `ondblclick`
  4. 高度与内边距收紧（贴近任务栏信息条视觉）

### 3) 窗口模式逻辑优化

- 文件：`src/lib/services/windowModeService.js`
- 调整：
  1. 任务栏高度由 `72` 调整为 `52`
  2. 增加 `currentAppliedMode`，重复切换同模式直接返回，避免无效窗口 API 调用
  3. 任务栏模式继续保持：置顶、不可拉伸、右下贴边

### 4) i18n 文案清理

- 文件：`src/lib/i18n/translations.js`
- 调整：
  - 移除已废弃的任务栏视图标题文案键。

## 验证

1. `pnpm check`
2. `cargo check`

## 样式与尺寸进一步收敛

根据 UI 反馈继续优化任务栏条：

1. 去掉任务栏模式下双层边框（外层容器不再叠框）。
2. 任务栏条改为内容宽度驱动，不再固定长条宽度。
3. 通过 `TaskbarStrip` 的尺寸回调 + `fitTaskbarToContent` 动态同步窗口尺寸。
4. 尺寸测量改为基于 `scrollWidth/scrollHeight`，避免在初始窄窗时测量被裁剪导致内容显示不全。
5. 视觉改为轻量扁平胶囊样式，降低厚重感，任务栏高度上限进一步收敛。

## 固定宽度与防挤出优化

根据实际反馈，任务栏模式改为“固定宽度 + 固定列宽”策略：

1. 任务栏窗口固定宽高（避免数字变化导致窗口抖动）。
2. 条内指标使用固定栅格列宽，防止右侧内容被挤出。
3. 数值显示使用紧凑单位算法（`K/M/G`），降低字符串长度波动。

## 后续增强：仪表盘按内容自适应高度

为解决仪表盘模式下底部空白过多的问题，新增了按内容动态收缩高度能力：

1. `src/lib/services/windowModeService.js`
   - 新增 `fitDashboardHeight(contentHeight)`，根据内容高度计算窗口目标高度（带最小/最大边界）。
2. `src/routes/+page.svelte`
   - 通过 `ResizeObserver` 监听内容容器高度变化并触发窗口自适应。
   - 在轮询更新数据、模式切换回 dashboard 后都会触发一次高度拟合。
3. `src-tauri/tauri.conf.json`
   - 将窗口 `minHeight` 从 `520` 下调到 `360`，允许窗口真正收缩。
