# Phase 1 架构总览

## 目标

1. 用 Rust 重建监控采集核心，避免 C++ 历史安全问题扩散。
2. 保持前后端低耦合，为后续功能扩展（进程级网速、悬浮窗、历史统计）预留接口。
3. 将 UI 做成主题可配置，保障产品化演进能力。

## 模块划分

### 后端（`src-tauri/src/monitor`）

- `commands.rs`
  - 只负责 Tauri 命令入口：`get_monitor_snapshot`
- `service.rs`
  - 负责 CPU/内存/网络数据采集、网络速率增量计算
- `models.rs`
  - 统一定义序列化输出结构，前端只依赖 DTO

### 前端（`src/lib` + `src/routes`）

- `services/monitorService.js`
  - 仅处理 `invoke` 调用
- `utils/formatters.js`
  - 负责数据格式化，避免在视图中堆逻辑
- `components/dashboard/*`
  - 页面组件拆分，单一职责
- `styles/reset.css` + `styles/theme.css`
  - reset 清空默认样式
  - 主题变量管理，支持多主题切换

## 安全策略（第一阶段）

1. 去除 `opener` 插件和相关 capability 权限。
2. 命令层仅暴露一个受控读接口，不接受路径/命令字符串等高风险输入。
3. 后端只做本地采样，不落盘、不执行外部进程。

## 后续演进方向

1. 增加接口和网卡粒度过滤，避免多网卡环境统计偏差。
2. 引入采样窗口和异常平滑，降低瞬时抖动。
3. 增加监控日志（git ignore）与健康诊断命令，用于问题回溯。
