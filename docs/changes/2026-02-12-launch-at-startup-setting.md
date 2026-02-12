# 2026-02-12 主界面开机自启设置

## Summary
- 在主界面控制区新增“开机自启”开关。
- 开关直接读写 Windows `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`，不依赖前端本地缓存，状态真实可追踪。

## Root Design
- 前端仅负责 UI 与交互，不直接处理平台细节。
- 后端新增独立 `startup` 模块封装开机自启逻辑，保持与监控/窗口逻辑解耦。

## Changes
- `src-tauri/src/startup.rs`
  - 新增命令：
    - `get_launch_at_startup_enabled`
    - `set_launch_at_startup_enabled`
  - Windows 下使用注册表 Run 项实现开机自启开关。
  - 非 Windows 平台返回降级结果，避免崩溃。

- `src-tauri/src/lib.rs`
  - 注册上述两个 Tauri command 到 `invoke_handler`。

- `src/lib/services/startupService.js`
  - 新增前端服务层，统一封装 command 调用。

- `src/lib/components/dashboard/StartupToggle.svelte`
  - 新增独立开关组件，避免将逻辑堆进 `+page.svelte`。

- `src/routes/+page.svelte`
  - 主界面接入开机自启状态加载与切换。
  - 增加失败提示文案渲染。

- `src/lib/i18n/translations.js`
  - 增加中英文文案：
    - 开机自启标题/说明
    - 开关状态（已开启/已关闭）

## Validation
- `pnpm check` 通过。
- `cargo check` 通过。

