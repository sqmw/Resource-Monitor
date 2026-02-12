# 2026-02-12 改造记录：Phase 1 Bootstrap

## 改动范围

1. `src-tauri/src/lib.rs`
2. `src-tauri/src/monitor/*`
3. `src/routes/+page.svelte`
4. `src/routes/+layout.svelte`
5. `src/lib/styles/*`
6. `src/lib/components/dashboard/*`
7. `src/lib/services/monitorService.js`
8. `src/lib/utils/formatters.js`
9. `src-tauri/capabilities/default.json`
10. `src-tauri/Cargo.toml`
11. `package.json`

## 核心变化

1. 从模板 `greet` 命令迁移到 `get_monitor_snapshot`，提供监控快照读取能力。
2. 增加 Rust 监控服务：
   - 资源采集：CPU 全局占用、内存用量
   - 网络采集：收发累计和实时吞吐（基于增量/时间间隔计算）
3. 前端重做仪表盘 UI，加入主题切换和动效背景。
4. 全局 reset 样式落地，避免浏览器默认样式污染。
5. 删除 opener 插件与权限，降低攻击面。

## 风险点

1. `sysinfo` 网络统计在多网卡/虚拟网卡环境可能有偏差，后续需加入网卡过滤策略。
2. 当前采用 1s 轮询，极端低性能设备可能导致采样抖动。
3. 第一阶段仅实现全局指标，尚未覆盖 TrafficMonitor 的全部能力（如进程级流量）。

## 验证策略

1. Rust 编译检查：`cargo check`（`src-tauri`）
2. 前端类型检查：`pnpm check`
3. 联调运行：`pnpm tauri dev`
