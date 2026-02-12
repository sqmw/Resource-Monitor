# 2026-02-12 CPU Tile Aligned With Percent Primary

## Summary
- 修复主界面 CPU 卡片与其它资源卡片信息层级不一致的问题。

## Changes
- 文件：`src/routes/+page.svelte`
- CPU 卡片改为与内存/交换区/磁盘一致：
  - 主值显示占用率百分比
  - 副文案显示物理信息（当前频率 + 逻辑核数）

## Result
- 主界面各资源卡片展示规则统一：先看比例，再看物理量。
