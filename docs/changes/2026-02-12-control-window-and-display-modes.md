# 2026-02-12 主窗口控制台 + 展示窗口重构

## 背景
当前实现存在两个核心问题：
1. 展示模式与主窗口是单窗口互斥，无法并存。
2. 任务栏展示条样式松散，且在数据变化时会出现内容拥挤。

本次重构目标是把架构改为“主窗口控制 + 展示窗口独立渲染”，并补齐多屏与实时预览能力。

## 关键改动

### 1. 三窗口分层架构（主控 / 任务栏 / 悬浮窗）
- 文件：`src-tauri/tauri.conf.json`
- 新增窗口：
  - `main`：控制台窗口（可配置、可预览）
  - `taskbar`：任务栏信息条窗口（默认隐藏）
  - `floating`：悬浮展示窗口（默认隐藏）
- 所有窗口均 `skipTaskbar: true`，仅通过托盘管理显示。

### 2. 托盘菜单重构
- 文件：`src-tauri/src/lib.rs`
- 新增托盘动作：
  - 显示任务栏模式
  - 显示悬浮窗模式
  - 打开主窗口
  - 启动/退出任务栏拖动定位
- 托盘可直接切换展示模式，并通过事件通知前端同步状态（`tray://display-mode`）。

### 3. 窗口服务重构（根治单窗口模式切换）
- 文件：`src/lib/services/windowModeService.js`
- 重构为“跨窗口控制服务”：
  - `applyDisplayMode(mode)`：显示目标展示窗口并隐藏另一个
  - `copyDisplayModeToNextMonitor(mode)`：复制当前展示位置到下一个显示器
  - `openMainWindow()`：任意展示窗口可回到主控
  - 任务栏拖动/方向键微调仍保留，并持久化
- 新的布局存储键：`rm.window.layout.v2`。

### 4. 前端渲染按窗口角色分支
- 文件：`src/routes/+page.svelte`
- 按窗口 label 渲染不同 UI：
  - `main`：完整控制台（主题、语言、模式、复制到下一屏、实时预览）
  - `taskbar`：纯信息条展示
  - `floating`：双行紧凑悬浮展示
- 实时联动：主窗口修改主题/语言后，通过 `app://preferences-sync` 事件同步到展示窗口。

### 5. 视觉与信息密度优化
- 文件：`src/lib/components/dashboard/TaskbarStrip.svelte`
  - 改为双行网格布局（CPU/MEM + DL/UL + 时间）
  - 提升磨砂玻璃效果（`backdrop-filter` + 半透明边框）
  - 解决数据波动时右侧被挤出问题（网格列与省略策略）
- 文件：`src/lib/components/dashboard/FloatingPanel.svelte`
  - 新增悬浮窗组件，双列指标布局，磨砂玻璃视觉。

### 6. 单位压缩策略（任务栏/悬浮）
- 文件：`src/lib/utils/formatters.js`
- 任务栏/悬浮使用 `K/M/G` 压缩显示（不再显示 `KiB`）。
- 速率显示为 `K/s`、`M/s`、`G/s`，减少宽度波动。

## 持久化与回归
- 模式：`rm.displayMode`
- 主题/语言：`rm.theme`、`rm.language`
- 布局：`rm.window.layout.v2`
- 验证：`pnpm check`、`cargo check` 全部通过。

## 后续建议
1. 若需要“复制”成多个同时展示实例，可在下一阶段引入动态窗口工厂（按 monitor 创建多个 taskbar/floating 实例）。
2. 若要进一步提高玻璃真实感，可在 Rust 侧补充平台特定系统材质（Windows Acrylic/Mica）。

## 补充修复（任务栏窗口裁切）
- 问题：任务栏条改为双行后，窗口高度仍固定 42，导致高 DPI 下第二行被裁切。
- 修复：
  - `src-tauri/tauri.conf.json`：`taskbar` 高度约束改为固定 56。
  - `src/lib/services/windowModeService.js`：任务栏展示尺寸配置同步改为固定 56。
  - `src/lib/components/dashboard/TaskbarStrip.svelte`：同步提升最小高度、行高与内边距，保证双行文本完整显示。
- 结果：任务栏模式在常见 100%/125%/150% 缩放下不再截断下半行内容。

## 补充修复（展示窗口共存与可关闭）
- 问题：主窗口模式按钮采用单选逻辑，导致：
  - 任务栏与悬浮窗不能共存；
  - 再次点击已开启模式无法关闭。
- 修复：
  - `src/lib/services/windowModeService.js`
    - 增加 `displayVisibility` 持久化（`rm.displayVisibility`）。
    - 新增 `setDisplayVisibility(mode, visible)`，按窗口独立显示/隐藏，不再互斥隐藏另一窗口。
  - `src/lib/components/dashboard/ViewModePicker.svelte`
    - 改为多开关状态（`activeModes` + `onToggle`）。
  - `src/routes/+page.svelte`
    - 主窗口改为“独立开关”控制：任务栏与悬浮窗可同时显示；
    - 再次点击同一按钮可关闭对应展示窗口。
- 结果：展示窗口满足“可共存、可单独关闭”的交互预期。

## 补充修复（任务栏条布局异常）
- 问题：任务栏条右侧留白过大，时间区域与两行指标视觉失衡，整体观感“长且空”。
- 修复：
  - `src/lib/components/dashboard/TaskbarStrip.svelte`
    - 改为“上下两行”结构化布局：
      - 第一行：`CPU`、`MEM`、时间；
      - 第二行：`DL`、`UL`；
    - 去除跨行时间列，避免右侧重心异常。
  - `src/lib/services/windowModeService.js`
    - 任务栏默认宽度由 `720` 收敛到 `560`，最小宽度 `520`。
  - `src-tauri/tauri.conf.json`
    - `taskbar` 窗口默认宽度与最小宽度同步到 `560/520`。
- 结果：任务栏条更紧凑，信息密度和视觉平衡显著改善。
## 补充修复（任务栏按可用高度自适应）
- 问题：固定双行布局在部分缩放比/系统字号下会发生第二行裁切。
- 修复：
  - `src/routes/+page.svelte`：任务栏窗口实时读取 `window.innerHeight`，通过 `resize` 事件持续更新可用高度。
  - `src/lib/components/dashboard/TaskbarStrip.svelte`：新增 `availableHeight` 入参，低于阈值时自动切换为单行紧凑布局，高度足够时使用双行布局。
- 结果：任务栏显示策略由“固定布局”改为“按窗口实际高度决定布局”，避免底部被截断。

## 补充修复（任务栏强制双行）
- 反馈：任务栏目标就是双行信息，自动降级单行不符合产品预期。
- 调整：
  - `src/lib/components/dashboard/TaskbarStrip.svelte`：移除单行降级分支，恢复始终双行布局。
  - `src/lib/services/windowModeService.js`：任务栏高度约束提升到固定 `64`。
  - `src-tauri/tauri.conf.json`：`taskbar` 高度同步固定为 `64`。
  - `src/routes/+page.svelte`：移除任务栏高度监听与 `availableHeight` 透传。
- 结果：任务栏始终双行展示，避免一行回退造成的信息密度下降和观感不一致。

## 补充修复（任务栏双行表格左对齐）
- 问题：双行模式下第二行列起点与第一行不一致，视觉上像“漂移/居中”。
- 修复：
  - `src/lib/components/dashboard/TaskbarStrip.svelte`
    - 上下两行统一使用同一套三列栅格：`1fr 1fr 112px`。
    - 第二行增加隐藏占位第三列，保证 `DL/UL` 与第一行 `CPU/MEM` 垂直对齐。
    - 时间列改为左对齐，整体呈现“表格式左对齐”。
- 结果：两行指标列线一致，阅读路径更稳定。
## 补充修复（透明/毛玻璃表面样式 + 拖动时边框）
- 需求：展示窗口支持“完全透明”与“毛玻璃”风格；常态不显示边框，仅在任务栏拖动定位时显示边框。
- 实现：
  - `src/lib/components/dashboard/SurfacePicker.svelte`
    - 新增表面样式选择器（透明/毛玻璃/实底）。
  - `src/routes/+page.svelte`
    - 新增 `rm.surface` 持久化键。
    - 主窗口可切换 `surface`，并通过 `app://preferences-sync` 实时同步到任务栏/悬浮窗。
  - `src/lib/components/dashboard/TaskbarStrip.svelte`
    - 新增 `surface` 属性（`transparent|frosted|solid`）。
    - 常态边框透明，仅 `editMode`（拖动定位）显示边框。
  - `src/lib/components/dashboard/FloatingPanel.svelte`
    - 新增 `surface` 属性并应用对应背景/模糊策略。
- 结果：展示窗口常态更干净，交互态（拖动）才有边框提示。

## 补充修复（透明模式残留阴影）
- 问题：透明模式下仍可见轻微外缘阴影/壳体感。
- 修复：
  - `src-tauri/tauri.conf.json`
    - 为 `taskbar` 与 `floating` 窗口增加 `shadow: false`。
  - `src-tauri/capabilities/default.json`
    - 增加 `core:window:allow-set-shadow` 权限。
  - `src/lib/services/windowModeService.js`
    - 运行时调用 `setShadow(false)`，确保窗口阴影关闭。
  - `src/lib/components/dashboard/TaskbarStrip.svelte`
  - `src/lib/components/dashboard/FloatingPanel.svelte`
    - `transparent` 模式下去圆角并确保边框完全透明。
- 结果：透明模式更接近“无壳纯文字层”，只在任务栏拖动定位时显示可见边框。

## 补充优化（透明度与毛玻璃强度可拖动调节）
- 需求：支持对展示窗口的“透明百分比”和“毛玻璃强度”进行拖动调节。
- 实现：
  - `src/lib/components/dashboard/SurfaceTuner.svelte`
    - 新增滑杆控件（`Opacity 0~100`、`Blur 0~30`）。
  - `src/routes/+page.svelte`
    - 新增状态与持久化键：`rm.surfaceOpacity`、`rm.frostedBlur`。
    - 通过 `app://preferences-sync` 实时同步到任务栏与悬浮窗。
  - `src/lib/components/dashboard/TaskbarStrip.svelte`
  - `src/lib/components/dashboard/FloatingPanel.svelte`
    - 新增 `surfaceOpacity`、`frostedBlur` 参数并应用到背景与模糊滤镜。
- 结果：主窗口拖动滑杆时，预览和展示窗口同步更新，重启后保留上次参数。
## 补充修复（透明度滑杆无感）
- 问题：`color-mix + calc()` 在当前 WebView 环境下动态百分比存在兼容性不稳定，导致滑杆视觉变化不明显或无效。
- 修复：
  - `src/lib/components/dashboard/TaskbarStrip.svelte`
  - `src/lib/components/dashboard/FloatingPanel.svelte`
    - 改用 `rgba(..., alpha)` 作为动态透明度实现，去除对 `color-mix(calc())` 的依赖。
    - `surfaceOpacity` 转换为 `--rm-surface-alpha`（0~1）后直接驱动背景透明度。
- 结果：透明度与模糊滑杆拖动时可稳定、即时生效。
## 补充修复（Windows 底层灰底/宿主层可见）
- 问题：即使内容层透明，Windows 侧仍可见一层灰色宿主背景，看起来像“下一层窗口”。
- 修复：
  - `src/routes/+page.svelte`
    - 根据窗口角色（`taskbar`/`floating`）给 `html/body` 强制透明背景。
  - `src-tauri/tauri.conf.json`
    - 为 `taskbar`、`floating` 设置 `backgroundColor: #00000000`，确保窗口宿主层透明。
- 结果：展示窗口更接近真正悬浮透明层，减少底层灰底感。
## 补充修复（展示窗口 z-order 下沉）
- 问题：Windows 下展示窗口在运行一段时间或交互后可能掉到下层（虽然配置为 alwaysOnTop）。
- 修复：
  - `src/lib/services/windowModeService.js`
    - 新增 `liftWindowToTop()`，通过 `setAlwaysOnTop(false -> true)` 强制刷新 z-order。
    - 在窗口显示时调用一次提升。
    - 在展示窗口失焦时自动提升。
    - 增加 3 秒一次的 topmost 守护，防止被系统/其他窗口挤压下沉。
    - 任务栏定位模式切换后也执行提升。
- 结果：任务栏/悬浮窗恢复稳定顶层行为。
## 补充优化（智能置顶策略）
- 场景：展示窗口常驻顶层在全屏应用场景下会干扰。
- 实现：
  - `src-tauri/src/window_policy.rs`（新增）
    - 新增 Tauri 命令 `is_foreground_fullscreen`（Windows）用于检测当前前台窗口是否覆盖整屏。
  - `src-tauri/src/lib.rs`
    - 注册命令 `window_policy::is_foreground_fullscreen`。
  - `src-tauri/Cargo.toml`
    - 增加 `windows-sys` 依赖（仅 Windows 目标）。
  - `src/lib/services/windowModeService.js`
    - 新增 `topmostPolicy` 持久化：`rm.topmostPolicy`。
    - 支持三种策略：`auto`（全屏时让路）、`always`（始终顶层）、`manual`（不自动置顶）。
    - 展示窗口显示/失焦/守护逻辑全部按策略执行。
  - `src/lib/components/dashboard/TopmostPolicyPicker.svelte`（新增）
  - `src/routes/+page.svelte`
    - 主窗口增加策略切换 UI，并实时应用到任务栏/悬浮窗。
- 结果：日常保持悬浮体验，全屏时可自动避免遮挡。
## 补充优化（展示窗口遮挡内容 -> 鼠标穿透）
- 场景：展示窗口可见但会拦截鼠标，影响下层应用操作。
- 实现：
  - `src/lib/services/windowModeService.js`
    - 新增穿透持久化：`rm.clickThrough`。
    - 新增 `applyClickThroughToDisplays(enabled)`，对任务栏/悬浮窗统一设置 `setIgnoreCursorEvents`。
    - 在任务栏定位模式开启时自动临时关闭穿透，退出定位后恢复用户设置。
  - `src/routes/+page.svelte`
    - 主窗口新增 `鼠标穿透 ON/OFF` 开关，实时生效并持久化。
  - `src-tauri/capabilities/default.json`
    - 增加 `core:window:allow-set-ignore-cursor-events` 权限。
  - `src/lib/i18n/translations.js`
    - 新增中英文文案 `clickThrough`。
- 结果：展示窗口不再阻挡下层内容操作，必要时仍可通过托盘进入定位模式调整位置。
## 补充修复（全屏识别需点击才生效）
- 问题：`auto` 策略下，前台全屏切换后未能立即让路，常需手动点击全屏窗口。
- 修复：
  - `src/lib/services/windowModeService.js`
    - 展示窗口配置时尝试 `setFocusable(false)`，减少监视窗抢焦点。
    - `auto` 策略在非全屏时不再每次执行 `false->true` 抬层，改为直接 `setAlwaysOnTop(true)`。
    - 顶层守护轮询从 3s 提升到 500ms。
    - 在 `auto` 下仅在全屏状态变化时触发重应用，提升实时性且减少抖动。
  - `src-tauri/capabilities/default.json`
    - 新增 `core:window:allow-set-focusable` 权限。
- 结果：全屏切换识别更快，减少“必须点一下全屏窗口”现象。
## 补充修复（全屏误判导致展示发虚）
- 问题：全屏检测规则过宽，普通最大化或特定窗口状态被误判为全屏，触发错误策略切换。
- 修复：
  - `src-tauri/src/window_policy.rs`
    - 排除前台窗口属于本应用进程的情况，避免自触发误判。
    - 全屏判断增加严格条件：
      - 窗口覆盖显示器边界（容差 2px）
      - 且窗口样式为无边框或 popup 风格（排除普通带边框最大化窗口）
  - `src-tauri/Cargo.toml`
    - 增加 `Win32_System_Threading` 依赖特性用于进程 ID 判断。
- 结果：全屏识别更稳，减少非全屏场景下错误降级导致的显示不清晰。
## 补充调整（移除透明/毛玻璃/实底离散模式）
- 目标：表面效果仅通过连续参数调节，避免离散模式干扰。
- 调整：
  - `src/routes/+page.svelte`
    - 移除 `SurfacePicker` 与 `selectedSurface` 状态。
    - 保留并强化 `透明度%` + `毛玻璃强度` 两个滑杆作为唯一入口。
    - 跨窗口同步仅传递 `surfaceOpacity`、`frostedBlur`。
  - `src/lib/components/dashboard/TaskbarStrip.svelte`
  - `src/lib/components/dashboard/FloatingPanel.svelte`
    - 去除 `surface` 离散模式分支，统一按滑杆参数渲染背景与模糊。
- 结果：任何时候都可直接调透明和毛玻璃，不再需要先选“透明/毛玻璃/实底”。
## 补充调整（去掉离散材质入口）
- 需求：不再提供“透明/毛玻璃/实底”按钮，材质参数任何时候直接可调。
- 实现：
  - `src/routes/+page.svelte`
    - 移除 `SurfacePicker` 导入、状态与渲染。
    - 删除 `rm.surface` 读取与同步。
    - 主窗口仅保留 `透明度` 与 `毛玻璃强度` 两个滑杆入口。
  - `src/lib/components/dashboard/TaskbarStrip.svelte`
  - `src/lib/components/dashboard/FloatingPanel.svelte`
    - 去除离散 `surface` 参数与样式分支，统一按 `surfaceOpacity + frostedBlur` 渲染。
  - `src/lib/i18n/translations.js`
    - 删除离散材质相关文案键。
- 结果：材质调节路径统一为连续参数，交互更直接。
## 补充增强（新增高价值监测指标）
- 目标：提升监测信息实用性，避免仅 CPU/内存/上下行速率过于单薄。
- 后端扩展：
  - `src-tauri/src/monitor/models.rs`
    - `ResourceMetrics` 新增：
      - `swapUsedBytes` / `swapTotalBytes`
      - `diskUsedBytes` / `diskTotalBytes`
      - `processCount`
      - `uptimeSeconds`
    - `NetworkMetrics` 新增：
      - `downloadPeakBytesPerSec`
      - `uploadPeakBytesPerSec`
  - `src-tauri/src/monitor/service.rs`
    - 新增磁盘采集（总量/已用）。
    - 新增进程数量刷新与系统运行时长采集。
    - 新增网络实时速率峰值累计。
- 前端扩展：
  - `src/lib/types/monitor.d.ts` 同步类型定义。
  - `src/routes/+page.svelte`
    - 仪表盘新增卡片：交换内存、磁盘占用。
    - 下载/上传卡片增加峰值速率信息。
    - 标题区新增“运行时长 + 进程数”。
    - 进度区新增“交换区压力”。
  - `src/lib/utils/formatters.js`
    - 新增 `formatUptime(seconds)`。
  - `src/lib/i18n/translations.js`
    - 新增相关中英文文案。
- 结果：在不改变现有命令接口的前提下，监测信息覆盖面与诊断价值显著提升。
## 补充优化（统计卡片标题/数字对齐）
- 需求：卡片内“标题与标题对齐、数字与数字对齐”。
- 实现：
  - `src/lib/components/dashboard/StatTile.svelte`
    - 卡片改为固定三行模板：标题行 / 数值行 / 副标题行。
    - 统一标题与数值行高，减少中文/英文长度差异造成的视觉偏移。
    - 数值启用 `tabular-nums`，提高数字列对齐稳定性。
- 结果：同一行卡片中的标题与数值在视觉上严格对齐，扫描效率更高。
