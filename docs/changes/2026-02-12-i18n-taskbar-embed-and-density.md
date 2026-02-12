# 2026-02-12 改造记录：中英文设置 + 任务栏嵌入 + 紧凑度优化

## 背景

1. 当前界面仍存在可见空白浪费。
2. 需要中英文切换能力。
3. 需要支持“嵌入任务栏”的展示模式。

## 方案概述

1. 重排主页面布局为 `flex` 列流，避免窗口变高时内容被拉散。
2. 增加前端 i18n 字典与语言切换控件，设置写入 `localStorage`。
3. 新增“任务栏模式”：
   - 展示为条形实时指标（CPU/内存/上下行）
   - 窗口自动置顶、禁用缩放、缩成细条并贴屏幕右下角

## 关键改动

### 1) 页面与组件

1. `src/routes/+page.svelte`
   - 新增语言和视图模式状态与持久化
   - 新增任务栏模式渲染分支
   - 布局改为紧凑 flex 列流
2. `src/lib/components/dashboard/LanguagePicker.svelte`
3. `src/lib/components/dashboard/ViewModePicker.svelte`
4. `src/lib/components/dashboard/TaskbarStrip.svelte`
5. `src/lib/i18n/translations.js`

### 2) 窗口模式服务

1. `src/lib/services/windowModeService.js`
   - `dashboard` 模式：恢复可缩放和普通置顶状态
   - `taskbar` 模式：固定条形尺寸、始终置顶、贴边定位

### 3) Tauri 权限

1. `src-tauri/capabilities/default.json`
   - 新增窗口 API 权限：
     - `allow-set-size`
     - `allow-set-position`
     - `allow-set-resizable`
     - `allow-set-always-on-top`
     - `allow-current-monitor`
     - `allow-scale-factor`

## 任务栏嵌入显示设计

1. 显示内容：
   - `CPU`、`MEM`、`DL`、`UL`、采样时间
2. 视觉策略：
   - 单行紧凑信息条，优先“扫一眼即得”
   - 保留主题色高亮标题，弱化次要信息
3. 交互策略：
   - 通过“视图模式切换器”在仪表盘/任务栏间切换
   - 任务栏模式仍保留语言切换

## 验证

1. `pnpm check`
2. `cargo check`
