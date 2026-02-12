# 2026-02-12 Bundle Identifier 格式修复

## Summary
- 修复 Tauri 构建失败：`identifier` 使用了下划线 `_`，不符合 bundle identifier 规则。

## Changes
- `src-tauri/tauri.conf.json`
  - `identifier` 从 `com.ksun22515.resource_monitor` 改为 `com.ksun22515.resource-monitor`。

- `installer/resource_monitor.iss`
  - `AppId` 同步改为 `com.ksun22515.resource-monitor`，保持安装器与应用标识一致。

## Result
- `pnpm tauri build` 不再因 identifier 字符格式报错。
