export const LANGUAGES = [
  { id: "zh", label: "中文" },
  { id: "en", label: "EN" }
];

export const VIEW_MODES = [
  { id: "taskbar", label: { zh: "任务栏", en: "Taskbar" } },
  { id: "floating", label: { zh: "悬浮窗", en: "Floating" } }
];

const TEXTS = {
  zh: {
    slogan: "RUST REWRITE",
    appTitle: "Resource Monitor",
    sampledAt: "最近采样时间",
    cpu: "CPU",
    memoryUsed: "内存占用",
    swapUsed: "交换内存",
    diskUsed: "磁盘占用",
    processCount: "进程数",
    cpuCores: "逻辑核",
    cpuFrequency: "频率",
    uptime: "运行时长",
    download: "下载",
    upload: "上传",
    netPeak: "速率峰值",
    downloadPeak: "下载峰值",
    uploadPeak: "上传峰值",
    cpuSubtitle: "全局占用率",
    loading: "加载中",
    total: "总计",
    accumulated: "累计",
    cpuActivity: "CPU 活跃度",
    memoryPressure: "内存压力",
    swapPressure: "交换区压力",
    collectFailed: "采集失败",
    displayMode: "展示模式",
    surfaceOpacity: "透明度",
    surfaceBlur: "毛玻璃强度",
    textContrastAuto: "文字对比自动",
    textContrastFixed: "文字对比固定",
    taskbarPaddingX: "任务栏左右内边距",
    taskbarColumnGap: "任务栏列间距",
    taskbarGroupGap: "任务栏组间距",
    taskbarFontSize: "任务栏字号",
    topmostPolicy: "置顶策略",
    topmostAuto: "智能",
    topmostAlways: "始终置顶",
    topmostManual: "手动",
    launchAtStartup: "开机自启",
    launchAtStartupHint: "随系统启动主程序（托盘可管理展示窗口）",
    enabled: "已开启",
    disabled: "已关闭",
    clickThrough: "鼠标穿透",
    copyToNextScreen: "复制当前模式到下个屏幕",
    resetMainLayout: "重置主窗口布局",
    preview: "样式预览",
    previewHint: "下方预览会实时同步到展示窗口"
  },
  en: {
    slogan: "RUST REWRITE",
    appTitle: "Resource Monitor",
    sampledAt: "Sampled at",
    cpu: "CPU",
    memoryUsed: "Memory Used",
    swapUsed: "Swap Used",
    diskUsed: "Disk Used",
    processCount: "Processes",
    cpuCores: "Logical Cores",
    cpuFrequency: "Frequency",
    uptime: "Uptime",
    download: "Download",
    upload: "Upload",
    netPeak: "Rate Peak",
    downloadPeak: "DL Peak",
    uploadPeak: "UL Peak",
    cpuSubtitle: "Global utilization",
    loading: "Loading",
    total: "Total",
    accumulated: "Accumulated",
    cpuActivity: "CPU Activity",
    memoryPressure: "Memory Pressure",
    swapPressure: "Swap Pressure",
    collectFailed: "Collect failed",
    displayMode: "Display Mode",
    surfaceOpacity: "Opacity",
    surfaceBlur: "Frosted Blur",
    textContrastAuto: "Text Contrast Auto",
    textContrastFixed: "Text Contrast Fixed",
    taskbarPaddingX: "Taskbar Horizontal Padding",
    taskbarColumnGap: "Taskbar Column Gap",
    taskbarGroupGap: "Taskbar Group Gap",
    taskbarFontSize: "Taskbar Font Size",
    topmostPolicy: "Topmost Policy",
    topmostAuto: "Auto",
    topmostAlways: "Always On Top",
    topmostManual: "Manual",
    launchAtStartup: "Launch at Startup",
    launchAtStartupHint: "Start the app with system boot",
    enabled: "Enabled",
    disabled: "Disabled",
    clickThrough: "Click-through",
    copyToNextScreen: "Copy current mode to next screen",
    resetMainLayout: "Reset Main Window Layout",
    preview: "Live Preview",
    previewHint: "Changes are synced to display windows in real time"
  }
};

/**
 * @param {"zh"|"en"} language
 * @param {keyof typeof TEXTS["zh"]} key
 */
export function t(language, key) {
  return TEXTS[language]?.[key] ?? TEXTS.zh[key];
}
