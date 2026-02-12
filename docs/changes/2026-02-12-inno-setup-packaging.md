# 2026-02-12 Inno Setup 打包脚本

## Summary
- 新增 Inno Setup 安装包脚本，支持为 Windows 生成独立安装程序（`*.exe`）。
- 脚本内置中英文安装界面、桌面快捷方式、可选开机自启任务。

## Added
- `installer/resource_monitor.iss`
  - 默认打包目标：`src-tauri/target/release/resource_monitor.exe`
  - 输出目录：`dist-installer/`
  - 输出文件名：`ResourceMonitor-Setup-<version>.exe`
  - 安装阶段可勾选开机自启（写入 `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`）
  - 安装结束可直接启动应用

## README Update
- `README.md` 增加 Inno Setup 打包命令与产物路径说明。

## Usage
1. 先构建 Tauri 发布产物：
   - `pnpm tauri build`
2. 再编译 Inno Setup 脚本：
   - `"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\resource_monitor.iss`

## Notes
- 如果脚本检测不到 `src-tauri/target/release/resource_monitor.exe`，会中止并提示先执行构建命令。
- 若更新版本号，请同步修改 `installer/resource_monitor.iss` 里的 `AppVersion`。
