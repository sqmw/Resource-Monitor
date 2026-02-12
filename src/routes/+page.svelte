<script>
  import { onMount, tick } from "svelte";
  import { emit, listen } from "@tauri-apps/api/event";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import StatTile from "../lib/components/dashboard/StatTile.svelte";
  import ProgressTrack from "../lib/components/dashboard/ProgressTrack.svelte";
  import ThemePicker from "../lib/components/dashboard/ThemePicker.svelte";
  import SurfaceTuner from "../lib/components/dashboard/SurfaceTuner.svelte";
  import TaskbarLayoutTuner from "../lib/components/dashboard/TaskbarLayoutTuner.svelte";
  import TextContrastPicker from "../lib/components/dashboard/TextContrastPicker.svelte";
  import TopmostPolicyPicker from "../lib/components/dashboard/TopmostPolicyPicker.svelte";
  import LanguagePicker from "../lib/components/dashboard/LanguagePicker.svelte";
  import ViewModePicker from "../lib/components/dashboard/ViewModePicker.svelte";
  import TaskbarStrip from "../lib/components/dashboard/TaskbarStrip.svelte";
  import FloatingPanel from "../lib/components/dashboard/FloatingPanel.svelte";
  import WindowFrame from "../lib/components/window/WindowFrame.svelte";
  import { fetchMonitorSnapshot } from "../lib/services/monitorService";
  import {
    initMainWindowLayoutPersistence,
    resetMainWindowLayout,
    restoreMainWindowLayout
  } from "../lib/services/mainWindowStateService";
  import {
    AUTO_CONTRAST_POLL_MS,
    resolveContrastTone,
    sampleCurrentWindowBackdropLuminance
  } from "../lib/services/contrastService";
  import {
    copyDisplayModeToNextMonitor,
    initDisplayWindowLayoutPersistence,
    loadDisplayVisibility,
    loadClickThroughEnabled,
    loadTopmostPolicy,
    listenEvent,
    loadDisplayMode,
    nudgeDisplayPosition,
    openMainWindow,
    applyTopmostPolicyToDisplays,
    applyClickThroughToDisplays,
    setDisplayVisibility,
    setDisplayManualPositioning,
    startDisplayManualDrag
  } from "../lib/services/windowModeService";
  import {
    formatCompactBytes,
    formatCompactRate,
    formatCpuFrequency,
    formatBytes,
    formatPercent,
    formatRate,
    formatTimestamp,
    formatUptime
  } from "../lib/utils/formatters";
  import { LANGUAGES, VIEW_MODES, t } from "../lib/i18n/translations";
  import { DEFAULT_TASKBAR_LAYOUT, DISPLAY_WINDOW_CONFIG } from "../lib/config/displayConfig";

  /** @typedef {import("../lib/types/monitor").MonitorSnapshot} MonitorSnapshot */
  /** @typedef {"zh" | "en"} Language */
  /** @typedef {"taskbar" | "floating"} DisplayMode */
  /** @typedef {"auto" | "always" | "manual"} TopmostPolicy */
  /** @typedef {"auto" | "fixed"} TextContrastMode */
  /** @typedef {"light" | "dark"} ContrastTone */

  const themes = [
    { id: "aurora", label: "Aurora" },
    { id: "ember", label: "Ember" },
    { id: "forest", label: "Forest" }
  ];
  const topmostPolicyOrder = ["auto", "always", "manual"];
  const textContrastModeOrder = ["auto", "fixed"];

  const STORAGE_KEYS = {
    theme: "rm.theme",
    language: "rm.language",
    displayMode: "rm.displayMode",
    surfaceOpacity: "rm.surfaceOpacity",
    frostedBlur: "rm.frostedBlur",
    textContrastMode: "rm.textContrastMode",
    taskbarLayout: "rm.taskbarLayout",
    topmostPolicy: "rm.topmostPolicy",
    clickThrough: "rm.clickThrough"
  };

  /** @type {MonitorSnapshot | null} */
  let snapshot = /** @type {MonitorSnapshot | null} */ ($state(null));
  let loading = $state(true);
  /** @type {Language} */
  let selectedLanguage = $state("zh");
  /** @type {DisplayMode} */
  let selectedDisplayMode = $state("taskbar");
  let displayVisibility = $state({ taskbar: true, floating: false });
  let selectedTheme = $state("aurora");
  let surfaceOpacity = $state(38);
  let frostedBlur = $state(16);
  /** @type {TextContrastMode} */
  let textContrastMode = $state("auto");
  /** @type {ContrastTone} */
  let displayContrastTone = $state("light");
  let contrastRefreshTick = $state(0);
  let taskbarLayout = $state({ ...DEFAULT_TASKBAR_LAYOUT });
  /** @type {TopmostPolicy} */
  let topmostPolicy = $state("auto");
  let clickThroughEnabled = $state(false);
  let errorMessage = $state("");
  let displayPositionEditMode = $state(false);

  const currentLabel = getCurrentWindow().label;
  let isMainWindow = $derived(currentLabel === "main");
  let isTaskbarWindow = $derived(currentLabel === "taskbar");
  let isFloatingWindow = $derived(currentLabel === "floating");

  let cpuUsagePercent = $derived(snapshot?.resources?.cpuUsagePercent ?? 0);
  let memoryUsed = $derived(snapshot?.resources?.memoryUsedBytes ?? 0);
  let memoryTotal = $derived(snapshot?.resources?.memoryTotalBytes ?? 0);
  let cpuLogicalCores = $derived(snapshot?.resources?.cpuLogicalCores ?? 0);
  let cpuFrequencyMhz = $derived(snapshot?.resources?.cpuFrequencyMhz ?? 0);
  let swapUsed = $derived(snapshot?.resources?.swapUsedBytes ?? 0);
  let swapTotal = $derived(snapshot?.resources?.swapTotalBytes ?? 0);
  let diskUsed = $derived(snapshot?.resources?.diskUsedBytes ?? 0);
  let diskTotal = $derived(snapshot?.resources?.diskTotalBytes ?? 0);
  let processCount = $derived(snapshot?.resources?.processCount ?? 0);
  let uptimeSeconds = $derived(snapshot?.resources?.uptimeSeconds ?? 0);
  let memoryPercent = $derived(memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0);
  let swapPercent = $derived(swapTotal > 0 ? (swapUsed / swapTotal) * 100 : 0);
  let downloadRate = $derived(snapshot?.network?.downloadBytesPerSec ?? 0);
  let uploadRate = $derived(snapshot?.network?.uploadBytesPerSec ?? 0);
  let downloadPeakRate = $derived(snapshot?.network?.downloadPeakBytesPerSec ?? 0);
  let uploadPeakRate = $derived(snapshot?.network?.uploadPeakBytesPerSec ?? 0);
  let topmostPolicies = $derived(
    topmostPolicyOrder.map((id) => ({
      id,
      label: t(
        selectedLanguage,
        id === "auto" ? "topmostAuto" : id === "always" ? "topmostAlways" : "topmostManual"
      )
    }))
  );
  let textContrastModes = $derived(
    textContrastModeOrder.map((id) => ({
      id,
      label: t(selectedLanguage, id === "auto" ? "textContrastAuto" : "textContrastFixed")
    }))
  );

  /**
   * @param {unknown} raw
   */
  function normalizeTaskbarLayout(raw) {
    if (!raw || typeof raw !== "object") return { ...DEFAULT_TASKBAR_LAYOUT };
    const value = /** @type {{ paddingX?: number; paddingY?: number; columnGap?: number; groupGap?: number; fontSize?: number }} */ (raw);
    return {
      paddingX: Math.max(2, Math.min(14, Math.round(value.paddingX ?? DEFAULT_TASKBAR_LAYOUT.paddingX))),
      // Keep taskbar vertical rhythm tight; migrate legacy oversized values from older versions.
      paddingY: Math.max(0, Math.min(4, Math.round(value.paddingY ?? DEFAULT_TASKBAR_LAYOUT.paddingY))),
      columnGap: Math.max(2, Math.min(12, Math.round(value.columnGap ?? DEFAULT_TASKBAR_LAYOUT.columnGap))),
      groupGap: Math.max(0, Math.min(20, Math.round(value.groupGap ?? DEFAULT_TASKBAR_LAYOUT.groupGap))),
      fontSize: Math.max(10, Math.min(15, Math.round(value.fontSize ?? DEFAULT_TASKBAR_LAYOUT.fontSize)))
    };
  }

  async function refreshDisplayContrastTone() {
    if (textContrastMode !== "auto") return;
    if (!isTaskbarWindow && !isFloatingWindow) return;

    const sampledLuminance = await sampleCurrentWindowBackdropLuminance();
    displayContrastTone = resolveContrastTone(sampledLuminance, displayContrastTone);
    contrastRefreshTick = (contrastRefreshTick + 1) % 1000000;
  }

  function loadPreferences() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (savedTheme && themes.some((theme) => theme.id === savedTheme)) {
      selectedTheme = savedTheme;
    }

    const savedLanguage = localStorage.getItem(STORAGE_KEYS.language);
    if (savedLanguage === "zh" || savedLanguage === "en") {
      selectedLanguage = savedLanguage;
    }
    const savedOpacity = Number(localStorage.getItem(STORAGE_KEYS.surfaceOpacity));
    if (Number.isFinite(savedOpacity)) {
      surfaceOpacity = Math.max(0, Math.min(100, Math.round(savedOpacity)));
    }
    const savedBlur = Number(localStorage.getItem(STORAGE_KEYS.frostedBlur));
    if (Number.isFinite(savedBlur)) {
      frostedBlur = Math.max(0, Math.min(30, Math.round(savedBlur)));
    }
    const savedTextContrastMode = localStorage.getItem(STORAGE_KEYS.textContrastMode);
    if (savedTextContrastMode === "auto" || savedTextContrastMode === "fixed") {
      textContrastMode = savedTextContrastMode;
    }
    try {
      const savedTaskbarLayout = localStorage.getItem(STORAGE_KEYS.taskbarLayout);
      if (savedTaskbarLayout) {
        taskbarLayout = normalizeTaskbarLayout(JSON.parse(savedTaskbarLayout));
      }
    } catch {
      taskbarLayout = { ...DEFAULT_TASKBAR_LAYOUT };
    }
    const savedTopmostPolicy = localStorage.getItem(STORAGE_KEYS.topmostPolicy);
    if (
      savedTopmostPolicy === "auto" ||
      savedTopmostPolicy === "always" ||
      savedTopmostPolicy === "manual"
    ) {
      topmostPolicy = savedTopmostPolicy;
    } else {
      topmostPolicy = loadTopmostPolicy();
    }
    clickThroughEnabled = loadClickThroughEnabled();

    selectedDisplayMode = loadDisplayMode();
    displayVisibility = loadDisplayVisibility();
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  function persistPreference(key, value) {
    localStorage.setItem(key, value);
  }

  async function broadcastPreferences() {
    await emit("app://preferences-sync", {
      theme: selectedTheme,
      language: selectedLanguage,
      surfaceOpacity,
      frostedBlur,
      textContrastMode,
      taskbarLayout
    });
  }

  /**
   * @param {string} theme
   */
  function selectTheme(theme) {
    selectedTheme = theme;
    persistPreference(STORAGE_KEYS.theme, theme);
    void broadcastPreferences();
  }

  /**
   * @param {Language} language
   */
  function selectLanguage(language) {
    selectedLanguage = language;
    persistPreference(STORAGE_KEYS.language, language);
    void broadcastPreferences();
  }

  /**
   * @param {number} value
   */
  function selectSurfaceOpacity(value) {
    surfaceOpacity = Math.max(0, Math.min(100, Math.round(value)));
    persistPreference(STORAGE_KEYS.surfaceOpacity, String(surfaceOpacity));
    void broadcastPreferences();
  }

  /**
   * @param {number} value
   */
  function selectFrostedBlur(value) {
    frostedBlur = Math.max(0, Math.min(30, Math.round(value)));
    persistPreference(STORAGE_KEYS.frostedBlur, String(frostedBlur));
    void broadcastPreferences();
  }

  /**
   * @param {TextContrastMode} mode
   */
  function selectTextContrastMode(mode) {
    textContrastMode = mode;
    persistPreference(STORAGE_KEYS.textContrastMode, mode);
    void broadcastPreferences();
    if (mode === "auto") {
      void refreshDisplayContrastTone();
    }
  }

  /**
   * @param {{ paddingX?: number; paddingY?: number; columnGap?: number; groupGap?: number; fontSize?: number }} patch
   */
  function updateTaskbarLayout(patch) {
    taskbarLayout = normalizeTaskbarLayout({ ...taskbarLayout, ...patch });
    persistPreference(STORAGE_KEYS.taskbarLayout, JSON.stringify(taskbarLayout));
    void broadcastPreferences();
  }

  /**
   * @param {number} value
   */
  function selectTaskbarPaddingX(value) {
    updateTaskbarLayout({ paddingX: value });
  }

  /**
   * @param {number} value
   */
  function selectTaskbarColumnGap(value) {
    updateTaskbarLayout({ columnGap: value });
  }

  /**
   * @param {number} value
   */
  function selectTaskbarGroupGap(value) {
    updateTaskbarLayout({ groupGap: value });
  }

  /**
   * @param {number} value
   */
  function selectTaskbarFontSize(value) {
    updateTaskbarLayout({ fontSize: value });
  }

  /**
   * @param {TopmostPolicy} policy
   */
  async function selectTopmostPolicy(policy) {
    topmostPolicy = policy;
    persistPreference(STORAGE_KEYS.topmostPolicy, policy);
    await applyTopmostPolicyToDisplays(policy);
  }

  async function toggleClickThrough() {
    clickThroughEnabled = !clickThroughEnabled;
    persistPreference(STORAGE_KEYS.clickThrough, String(clickThroughEnabled));
    await applyClickThroughToDisplays(clickThroughEnabled);
  }

  /**
   * @param {DisplayMode} mode
   */
  async function toggleDisplayMode(mode) {
    const nextVisible = !displayVisibility[mode];
    displayVisibility = { ...displayVisibility, [mode]: nextVisible };
    if (nextVisible) {
      selectedDisplayMode = mode;
      persistPreference(STORAGE_KEYS.displayMode, mode);
    }
    await setDisplayVisibility(mode, nextVisible);
  }

  async function copyCurrentModeToNextScreen() {
    await copyDisplayModeToNextMonitor(selectedDisplayMode);
  }

  async function resetMainLayout() {
    await resetMainWindowLayout();
  }

  /**
   * @returns {DisplayMode | null}
   */
  function getCurrentDisplayRole() {
    if (isTaskbarWindow) return "taskbar";
    if (isFloatingWindow) return "floating";
    return null;
  }

  async function handleDisplayStartPositioning() {
    if (!displayPositionEditMode) return;
    const role = getCurrentDisplayRole();
    if (!role) return;
    await startDisplayManualDrag(role);
  }

  /**
   * @param {number} dx
   * @param {number} dy
   */
  function handleDisplayNudge(dx, dy) {
    if (!displayPositionEditMode) return;
    const role = getCurrentDisplayRole();
    if (!role) return;
    void nudgeDisplayPosition(role, dx, dy);
  }

  /**
   * @param {KeyboardEvent} event
   */
  function handleDisplayArrowNudge(event) {
    if (!displayPositionEditMode) return;
    const base = event.repeat ? 10 : 3;
    const step = event.shiftKey ? base * 2 : base;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handleDisplayNudge(-step, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      handleDisplayNudge(step, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      handleDisplayNudge(0, -step);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      handleDisplayNudge(0, step);
    }
  }

  /**
   * @param {{ theme?: string; language?: string; surfaceOpacity?: number; frostedBlur?: number; textContrastMode?: TextContrastMode; taskbarLayout?: { paddingX?: number; paddingY?: number; columnGap?: number; groupGap?: number; fontSize?: number } } | null | undefined} payload
   */
  function applyPreferencePayload(payload) {
    if (!payload || typeof payload !== "object") return;
    const nextTheme = payload.theme;
    const nextLanguage = payload.language;

    if (typeof nextTheme === "string" && themes.some((theme) => theme.id === nextTheme)) {
      selectedTheme = nextTheme;
      persistPreference(STORAGE_KEYS.theme, nextTheme);
    }

    if (nextLanguage === "zh" || nextLanguage === "en") {
      selectedLanguage = nextLanguage;
      persistPreference(STORAGE_KEYS.language, nextLanguage);
    }

    if (typeof payload.surfaceOpacity === "number" && Number.isFinite(payload.surfaceOpacity)) {
      surfaceOpacity = Math.max(0, Math.min(100, Math.round(payload.surfaceOpacity)));
      persistPreference(STORAGE_KEYS.surfaceOpacity, String(surfaceOpacity));
    }

    if (typeof payload.frostedBlur === "number" && Number.isFinite(payload.frostedBlur)) {
      frostedBlur = Math.max(0, Math.min(30, Math.round(payload.frostedBlur)));
      persistPreference(STORAGE_KEYS.frostedBlur, String(frostedBlur));
    }

    if (payload.textContrastMode === "auto" || payload.textContrastMode === "fixed") {
      textContrastMode = payload.textContrastMode;
      persistPreference(STORAGE_KEYS.textContrastMode, textContrastMode);
      if (textContrastMode === "auto") {
        void refreshDisplayContrastTone();
      }
    }

    if (payload.taskbarLayout && typeof payload.taskbarLayout === "object") {
      taskbarLayout = normalizeTaskbarLayout(payload.taskbarLayout);
      persistPreference(STORAGE_KEYS.taskbarLayout, JSON.stringify(taskbarLayout));
    }
  }

  $effect(() => {
    document.documentElement.dataset.theme = selectedTheme;
  });

  $effect(() => {
    document.documentElement.dataset.windowRole = currentLabel;
    document.body.dataset.windowRole = currentLabel;
  });

  $effect(() => {
    if (!isFloatingWindow || !displayPositionEditMode) return;
    void tick().then(() => {
      document.getElementById("floating-position-layer")?.focus();
    });
  });

  onMount(() => {
    let running = true;
    loadPreferences();

    let disposeMainLayoutPersistence = () => {};
    if (isMainWindow) {
      void restoreMainWindowLayout()
        .then(() =>
          Promise.all([
            setDisplayVisibility("taskbar", displayVisibility.taskbar, { persist: false }),
            setDisplayVisibility("floating", displayVisibility.floating, { persist: false })
          ])
        )
        .then(() => applyTopmostPolicyToDisplays(topmostPolicy))
        .then(() => applyClickThroughToDisplays(clickThroughEnabled))
        .then(() => broadcastPreferences());
      void initMainWindowLayoutPersistence().then((cleanup) => {
        disposeMainLayoutPersistence = cleanup;
      });
    }

    let disposeDisplayPersistence = () => {};
    if (isTaskbarWindow) {
      void initDisplayWindowLayoutPersistence("taskbar").then((cleanup) => {
        disposeDisplayPersistence = cleanup;
      });
    }

    if (isFloatingWindow) {
      void initDisplayWindowLayoutPersistence("floating").then((cleanup) => {
        disposeDisplayPersistence = cleanup;
      });
    }

    let disposeTrayPositioningListener = () => {};
    let disposeTrayLegacyPositioningListener = () => {};
    if (isTaskbarWindow || isFloatingWindow) {
      const role = getCurrentDisplayRole();
      void listen("tray://display-positioning", (event) => {
        const enabled = Boolean(event.payload);
        displayPositionEditMode = enabled;
        if (!role) return;
        void setDisplayManualPositioning(role, enabled);
      }).then((unlisten) => {
        disposeTrayPositioningListener = unlisten;
      });

      // Backward-compatible event name.
      void listen("tray://taskbar-positioning", (event) => {
        const enabled = Boolean(event.payload);
        displayPositionEditMode = enabled;
        if (!role) return;
        void setDisplayManualPositioning(role, enabled);
      }).then((unlisten) => {
        disposeTrayLegacyPositioningListener = unlisten;
      });
    }

    let disposeDisplayModeListener = () => {};
    void listenEvent("app://display-visibility", (payload) => {
      if (!payload || typeof payload !== "object") return;
      if (payload.mode === "taskbar" || payload.mode === "floating") {
        displayVisibility = {
          ...displayVisibility,
          [payload.mode]: Boolean(payload.visible)
        };
        if (payload.visible) {
          selectedDisplayMode = payload.mode;
          persistPreference(STORAGE_KEYS.displayMode, payload.mode);
        }
      }
    }).then((cleanup) => {
      disposeDisplayModeListener = cleanup;
    });

    let disposePreferenceSync = () => {};
    void listenEvent("app://preferences-sync", (payload) => {
      applyPreferencePayload(payload);
    }).then((cleanup) => {
      disposePreferenceSync = cleanup;
    });

    let disposeContrastMoved = () => {};
    let disposeContrastResized = () => {};
    if (isTaskbarWindow || isFloatingWindow) {
      void getCurrentWindow()
        .onMoved(() => {
          void refreshDisplayContrastTone();
        })
        .then((cleanup) => {
          disposeContrastMoved = cleanup;
        });
      void getCurrentWindow()
        .onResized(() => {
          void refreshDisplayContrastTone();
        })
        .then((cleanup) => {
          disposeContrastResized = cleanup;
        });
    }

    const pollSnapshot = async () => {
      try {
        const data = await fetchMonitorSnapshot();
        if (!running) return;
        snapshot = data;
        loading = false;
        errorMessage = "";
      } catch (error) {
        if (!running) return;
        errorMessage = String(error);
      }
    };

    pollSnapshot();
    const timerId = setInterval(pollSnapshot, 1000);

    const contrastTimerId =
      isTaskbarWindow || isFloatingWindow
        ? setInterval(() => {
            void refreshDisplayContrastTone();
          }, AUTO_CONTRAST_POLL_MS)
        : null;
    if (isTaskbarWindow || isFloatingWindow) {
      void refreshDisplayContrastTone();
    }

    return () => {
      running = false;
      clearInterval(timerId);
      if (contrastTimerId !== null) {
        clearInterval(contrastTimerId);
      }
      disposeDisplayPersistence();
      disposeMainLayoutPersistence();
      disposeTrayPositioningListener();
      disposeTrayLegacyPositioningListener();
      disposeDisplayModeListener();
      disposePreferenceSync();
      disposeContrastMoved();
      disposeContrastResized();
    };
  });
</script>

{#if isMainWindow}
  <main class="page main-page">
    <section class="dashboard">
      <WindowFrame title={t(selectedLanguage, "appTitle")} />
      <div class="content">
        <div class="workspace">
          <section class="main-content">
            <header class="head">
              <div>
                <p class="eyebrow">{t(selectedLanguage, "slogan")}</p>
                <h1>{t(selectedLanguage, "appTitle")}</h1>
                <p class="meta">
                  {t(selectedLanguage, "sampledAt")}: {formatTimestamp(snapshot?.collectedAtUnixMs)}
                </p>
                <p class="meta secondary">
                  {t(selectedLanguage, "uptime")}: {loading ? "--" : formatUptime(uptimeSeconds)}
                  · {t(selectedLanguage, "processCount")}: {loading ? "--" : processCount.toLocaleString()}
                </p>
              </div>
            </header>

            {#if errorMessage}
              <p class="error">{t(selectedLanguage, "collectFailed")}: {errorMessage}</p>
            {/if}

            <section class="grid compact-two-rows">
              <StatTile
                title={t(selectedLanguage, "cpu")}
                value={loading ? "--" : formatPercent(cpuUsagePercent)}
                subtitle={loading
                  ? t(selectedLanguage, "loading")
                  : `${t(selectedLanguage, "cpuFrequency")} ${formatCpuFrequency(cpuFrequencyMhz)} · ${t(selectedLanguage, "cpuCores")} ${cpuLogicalCores}`}
                accent={cpuUsagePercent > 70}
              />
              <StatTile
                title={t(selectedLanguage, "memoryUsed")}
                value={loading ? "--" : formatPercent(memoryPercent)}
                subtitle={loading
                  ? t(selectedLanguage, "loading")
                  : `${formatBytes(memoryUsed)} / ${formatBytes(memoryTotal)}`}
              />
              <StatTile
                title={t(selectedLanguage, "swapUsed")}
                value={loading ? "--" : formatPercent(swapPercent)}
                subtitle={loading
                  ? t(selectedLanguage, "loading")
                  : `${formatBytes(swapUsed)} / ${formatBytes(swapTotal)}`}
              />
              <StatTile
                title={t(selectedLanguage, "diskUsed")}
                value={loading
                  ? "--"
                  : formatPercent(diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0)}
                subtitle={loading
                  ? t(selectedLanguage, "loading")
                  : `${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}`}
              />
              <StatTile
                title={t(selectedLanguage, "download")}
                value={loading ? "--" : formatRate(downloadRate)}
                subtitle={loading
                  ? t(selectedLanguage, "loading")
                  : `${t(selectedLanguage, "accumulated")} ${formatBytes(snapshot?.network?.receivedTotalBytes ?? 0)} · ${t(selectedLanguage, "downloadPeak")} ${formatRate(downloadPeakRate)}`}
              />
              <StatTile
                title={t(selectedLanguage, "upload")}
                value={loading ? "--" : formatRate(uploadRate)}
                subtitle={loading
                  ? t(selectedLanguage, "loading")
                  : `${t(selectedLanguage, "accumulated")} ${formatBytes(snapshot?.network?.transmittedTotalBytes ?? 0)} · ${t(selectedLanguage, "uploadPeak")} ${formatRate(uploadPeakRate)}`}
              />
            </section>

            <section class="usage">
              <ProgressTrack
                label={t(selectedLanguage, "cpuActivity")}
                valueText={loading ? "--" : formatPercent(cpuUsagePercent)}
                percent={cpuUsagePercent}
                warning={cpuUsagePercent > 80}
              />
              <ProgressTrack
                label={t(selectedLanguage, "memoryPressure")}
                valueText={loading ? "--" : formatPercent(memoryPercent)}
                percent={memoryPercent}
                warning={memoryPercent > 80}
              />
              <ProgressTrack
                label={t(selectedLanguage, "swapPressure")}
                valueText={loading ? "--" : formatPercent(swapPercent)}
                percent={swapPercent}
                warning={swapPercent > 80}
              />
            </section>

            <section class="preview">
              <p class="preview-title">{t(selectedLanguage, "preview")}</p>
              <p class="preview-hint">{t(selectedLanguage, "previewHint")}</p>
              <div
                class={`preview-body ${selectedDisplayMode === "taskbar" ? "preview-taskbar-body" : ""}`}
                style={`--preview-taskbar-width:${DISPLAY_WINDOW_CONFIG.taskbar.width}px;--preview-taskbar-height:${DISPLAY_WINDOW_CONFIG.taskbar.height}px;`}
              >
                {#if selectedDisplayMode === "taskbar"}
                  <TaskbarStrip
                    cpuValue={loading ? "--" : formatPercent(cpuUsagePercent)}
                    memoryValue={loading ? "--" : formatCompactBytes(memoryUsed)}
                    downloadValue={loading ? "--" : formatCompactRate(downloadRate)}
                    uploadValue={loading ? "--" : formatCompactRate(uploadRate)}
                    sampledAt={formatTimestamp(snapshot?.collectedAtUnixMs)}
                    onDoubleClick={openMainWindow}
                    surfaceOpacity={surfaceOpacity}
                    frostedBlur={frostedBlur}
                    textContrastMode={textContrastMode}
                    contrastTone={displayContrastTone}
                    contrastRefreshTick={contrastRefreshTick}
                    layout={taskbarLayout}
                  />
                {:else}
                  <FloatingPanel
                    cpuValue={loading ? "--" : formatPercent(cpuUsagePercent)}
                    memoryValue={loading ? "--" : formatCompactBytes(memoryUsed)}
                    memoryTotal={loading ? "--" : formatCompactBytes(memoryTotal)}
                    downloadValue={loading ? "--" : formatCompactRate(downloadRate)}
                    uploadValue={loading ? "--" : formatCompactRate(uploadRate)}
                    sampledAt={formatTimestamp(snapshot?.collectedAtUnixMs)}
                    labels={{ title: t(selectedLanguage, "appTitle") }}
                    surfaceOpacity={surfaceOpacity}
                    frostedBlur={frostedBlur}
                    textContrastMode={textContrastMode}
                    contrastTone={displayContrastTone}
                    contrastRefreshTick={contrastRefreshTick}
                  />
                {/if}
              </div>
            </section>
          </section>

          <aside class="control-stack">
            <ThemePicker themes={themes} selectedTheme={selectedTheme} onSelect={selectTheme} />
            <div class="inline-pickers">
              <LanguagePicker
                languages={LANGUAGES}
                selectedLanguage={selectedLanguage}
                onSelect={selectLanguage}
              />
              <ViewModePicker
                viewModes={VIEW_MODES}
                activeModes={displayVisibility}
                language={selectedLanguage}
                onToggle={toggleDisplayMode}
              />
            </div>
            <SurfaceTuner
              opacity={surfaceOpacity}
              blur={frostedBlur}
              labels={{
                opacity: t(selectedLanguage, "surfaceOpacity"),
                blur: t(selectedLanguage, "surfaceBlur")
              }}
              onOpacityChange={selectSurfaceOpacity}
              onBlurChange={selectFrostedBlur}
            />
            <TextContrastPicker
              modes={textContrastModes}
              selectedMode={textContrastMode}
              onSelect={selectTextContrastMode}
            />
            <TaskbarLayoutTuner
              values={taskbarLayout}
              labels={{
                paddingX: t(selectedLanguage, "taskbarPaddingX"),
                columnGap: t(selectedLanguage, "taskbarColumnGap"),
                groupGap: t(selectedLanguage, "taskbarGroupGap"),
                fontSize: t(selectedLanguage, "taskbarFontSize")
              }}
              onPaddingXChange={selectTaskbarPaddingX}
              onColumnGapChange={selectTaskbarColumnGap}
              onGroupGapChange={selectTaskbarGroupGap}
              onFontSizeChange={selectTaskbarFontSize}
            />
            <TopmostPolicyPicker
              policies={topmostPolicies}
              selectedPolicy={topmostPolicy}
              onSelect={selectTopmostPolicy}
            />
            <button class="copy-button" type="button" onclick={toggleClickThrough}>
              {t(selectedLanguage, "clickThrough")}: {clickThroughEnabled ? "ON" : "OFF"}
            </button>
            <button class="copy-button" type="button" onclick={copyCurrentModeToNextScreen}>
              {t(selectedLanguage, "copyToNextScreen")}
            </button>
            <button class="copy-button" type="button" onclick={resetMainLayout}>
              {t(selectedLanguage, "resetMainLayout")}
            </button>
          </aside>
        </div>
      </div>
    </section>
  </main>
{:else if isTaskbarWindow}
  <main class="display-shell taskbar-shell">
    <TaskbarStrip
      cpuValue={loading ? "--" : formatPercent(cpuUsagePercent)}
      memoryValue={loading ? "--" : formatCompactBytes(memoryUsed)}
      downloadValue={loading ? "--" : formatCompactRate(downloadRate)}
      uploadValue={loading ? "--" : formatCompactRate(uploadRate)}
      sampledAt={formatTimestamp(snapshot?.collectedAtUnixMs)}
      onDoubleClick={openMainWindow}
      editMode={displayPositionEditMode}
      onStartPositioning={handleDisplayStartPositioning}
      onNudgePosition={handleDisplayNudge}
      surfaceOpacity={surfaceOpacity}
      frostedBlur={frostedBlur}
      textContrastMode={textContrastMode}
      contrastTone={displayContrastTone}
      contrastRefreshTick={contrastRefreshTick}
      layout={taskbarLayout}
    />
  </main>
{:else}
  <main
    class:editing={displayPositionEditMode}
    class="display-shell floating-shell"
    ondblclick={openMainWindow}
  >
    {#if displayPositionEditMode}
      <button
        id="floating-position-layer"
        class="floating-position-layer"
        type="button"
        aria-label="position-display-window"
        onmousedown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          handleDisplayStartPositioning();
        }}
        onkeydown={handleDisplayArrowNudge}
      ></button>
    {/if}
    <FloatingPanel
      cpuValue={loading ? "--" : formatPercent(cpuUsagePercent)}
      memoryValue={loading ? "--" : formatCompactBytes(memoryUsed)}
      memoryTotal={loading ? "--" : formatCompactBytes(memoryTotal)}
      downloadValue={loading ? "--" : formatCompactRate(downloadRate)}
      uploadValue={loading ? "--" : formatCompactRate(uploadRate)}
      sampledAt={formatTimestamp(snapshot?.collectedAtUnixMs)}
      labels={{ title: t(selectedLanguage, "appTitle") }}
      surfaceOpacity={surfaceOpacity}
      frostedBlur={frostedBlur}
      textContrastMode={textContrastMode}
      contrastTone={displayContrastTone}
      contrastRefreshTick={contrastRefreshTick}
    />
  </main>
{/if}

<style>
  .page {
    width: 100%;
    height: 100vh;
    color: var(--text-main);
    background: radial-gradient(circle at 0% 0%, var(--bg-1), var(--bg-0) 58%);
    overflow: hidden;
  }

  .dashboard {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 0;
    background: linear-gradient(132deg, rgba(0, 0, 0, 0.27), rgba(0, 14, 20, 0.2));
    border: 1px solid var(--card-border);
    border-radius: 14px;
    backdrop-filter: blur(14px) saturate(115%);
    overflow: hidden;
  }

  .content {
    display: block;
    padding: 0.5rem 0.58rem 0.56rem;
    flex: 1;
    min-height: 0;
  }

  .workspace {
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 272px;
    gap: 0.5rem;
    min-height: 0;
    align-items: start;
  }

  .main-content {
    min-height: 0;
    display: grid;
    grid-template-rows: auto auto auto auto;
    gap: 0.42rem;
    align-content: start;
  }

  .head {
    display: block;
    margin-bottom: 0.06rem;
  }

  .control-stack {
    display: grid;
    gap: 0.26rem;
    align-content: start;
    align-self: start;
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 0.34rem 0.4rem;
    background: color-mix(in srgb, var(--card) 85%, rgba(7, 20, 30, 0.48));
    overflow: auto;
    max-height: calc(100vh - 92px);
  }

  .inline-pickers {
    display: flex;
    gap: 0.28rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .copy-button {
    border-radius: 8px;
    border: 1px solid var(--card-border);
    background: rgba(255, 255, 255, 0.08);
    padding: 0.28rem 0.56rem;
    font-size: 0.74rem;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.13em;
    color: var(--text-subtle);
    font-size: 0.65rem;
    margin-bottom: 0.08rem;
  }

  h1 {
    font-size: clamp(1.1rem, 2vw, 1.76rem);
    letter-spacing: 0.01em;
  }

  .meta {
    margin-top: 0.05rem;
    color: var(--text-subtle);
    font-size: 0.75rem;
  }

  .meta.secondary {
    margin-top: 0.03rem;
    font-size: 0.7rem;
    opacity: 0.92;
  }

  .error {
    color: var(--danger);
    font-size: 0.78rem;
  }

  .grid {
    display: grid;
    gap: 0.38rem;
  }

  .compact-two-rows {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .usage {
    display: grid;
    gap: 0.34rem;
    padding: 0.42rem;
    border-radius: 11px;
    border: 1px solid var(--card-border);
    background: var(--card);
  }

  .preview {
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 0.4rem;
    background: color-mix(in srgb, var(--card) 78%, rgba(6, 12, 19, 0.45));
    display: grid;
    gap: 0.22rem;
    min-height: 130px;
  }

  .preview-title {
    font-size: 0.74rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-subtle);
  }

  .preview-hint {
    font-size: 0.73rem;
    color: color-mix(in srgb, var(--text-subtle) 90%, white);
  }

  .preview-body {
    min-height: 44px;
    border-radius: 8px;
    overflow: hidden;
    align-self: start;
  }

  .preview-taskbar-body {
    width: var(--preview-taskbar-width);
    height: var(--preview-taskbar-height);
    max-width: 100%;
    min-height: var(--preview-taskbar-height);
    margin-left: auto;
    margin-right: auto;
  }

  .display-shell {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  .taskbar-shell {
    padding: 0;
    background: transparent;
  }

  .floating-shell {
    padding: 0.26rem;
    background: transparent;
    position: relative;
  }

  .floating-shell.editing {
    cursor: move;
    outline: 1px solid rgba(176, 228, 255, 0.56);
    outline-offset: -1px;
    border-radius: 10px;
  }

  .floating-position-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    border: 0;
    background: transparent;
    cursor: move;
  }

  @media (max-width: 980px) {
    .workspace {
      grid-template-columns: 1fr;
    }

    .control-stack {
      order: 2;
      max-height: 34vh;
    }

    .preview {
      min-height: 120px;
    }
  }

  @media (min-width: 1580px) {
    .compact-two-rows {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  :global(html[data-window-role="taskbar"]),
  :global(body[data-window-role="taskbar"]),
  :global(html[data-window-role="floating"]),
  :global(body[data-window-role="floating"]) {
    background: transparent !important;
  }
</style>
