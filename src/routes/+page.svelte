<script>
  import { onMount } from "svelte";
  import { emit, listen } from "@tauri-apps/api/event";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import StatTile from "../lib/components/dashboard/StatTile.svelte";
  import ProgressTrack from "../lib/components/dashboard/ProgressTrack.svelte";
  import ThemePicker from "../lib/components/dashboard/ThemePicker.svelte";
  import SurfaceTuner from "../lib/components/dashboard/SurfaceTuner.svelte";
  import TopmostPolicyPicker from "../lib/components/dashboard/TopmostPolicyPicker.svelte";
  import LanguagePicker from "../lib/components/dashboard/LanguagePicker.svelte";
  import ViewModePicker from "../lib/components/dashboard/ViewModePicker.svelte";
  import TaskbarStrip from "../lib/components/dashboard/TaskbarStrip.svelte";
  import FloatingPanel from "../lib/components/dashboard/FloatingPanel.svelte";
  import WindowFrame from "../lib/components/window/WindowFrame.svelte";
  import { fetchMonitorSnapshot } from "../lib/services/monitorService";
  import {
    copyDisplayModeToNextMonitor,
    initDisplayWindowLayoutPersistence,
    loadDisplayVisibility,
    loadClickThroughEnabled,
    loadTopmostPolicy,
    listenEvent,
    loadDisplayMode,
    nudgeTaskbarPosition,
    openMainWindow,
    applyTopmostPolicyToDisplays,
    applyClickThroughToDisplays,
    setDisplayVisibility,
    setTaskbarManualPositioning,
    startTaskbarManualDrag
  } from "../lib/services/windowModeService";
  import {
    formatCompactBytes,
    formatCompactRate,
    formatBytes,
    formatPercent,
    formatRate,
    formatTimestamp,
    formatUptime
  } from "../lib/utils/formatters";
  import { LANGUAGES, VIEW_MODES, t } from "../lib/i18n/translations";

  /** @typedef {import("../lib/types/monitor").MonitorSnapshot} MonitorSnapshot */
  /** @typedef {"zh" | "en"} Language */
  /** @typedef {"taskbar" | "floating"} DisplayMode */
  /** @typedef {"auto" | "always" | "manual"} TopmostPolicy */

  const themes = [
    { id: "aurora", label: "Aurora" },
    { id: "ember", label: "Ember" },
    { id: "forest", label: "Forest" }
  ];
  const topmostPolicyOrder = ["auto", "always", "manual"];

  const STORAGE_KEYS = {
    theme: "rm.theme",
    language: "rm.language",
    displayMode: "rm.displayMode",
    surfaceOpacity: "rm.surfaceOpacity",
    frostedBlur: "rm.frostedBlur",
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
  /** @type {TopmostPolicy} */
  let topmostPolicy = $state("auto");
  let clickThroughEnabled = $state(false);
  let errorMessage = $state("");
  let taskbarPositionEditMode = $state(false);

  const currentLabel = getCurrentWindow().label;
  let isMainWindow = $derived(currentLabel === "main");
  let isTaskbarWindow = $derived(currentLabel === "taskbar");
  let isFloatingWindow = $derived(currentLabel === "floating");

  let cpuUsagePercent = $derived(snapshot?.resources?.cpuUsagePercent ?? 0);
  let memoryUsed = $derived(snapshot?.resources?.memoryUsedBytes ?? 0);
  let memoryTotal = $derived(snapshot?.resources?.memoryTotalBytes ?? 0);
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
      frostedBlur
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

  async function handleTaskbarStartPositioning() {
    if (!taskbarPositionEditMode) return;
    await startTaskbarManualDrag();
  }

  /**
   * @param {number} dx
   * @param {number} dy
   */
  function handleTaskbarNudge(dx, dy) {
    if (!taskbarPositionEditMode) return;
    void nudgeTaskbarPosition(dx, dy);
  }

  /**
   * @param {{ theme?: string; language?: string; surfaceOpacity?: number; frostedBlur?: number } | null | undefined} payload
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
  }

  $effect(() => {
    document.documentElement.dataset.theme = selectedTheme;
  });

  $effect(() => {
    document.documentElement.dataset.windowRole = currentLabel;
    document.body.dataset.windowRole = currentLabel;
  });

  onMount(() => {
    let running = true;
    loadPreferences();

    if (isMainWindow) {
      void Promise.all([
        setDisplayVisibility("taskbar", displayVisibility.taskbar, { persist: false }),
        setDisplayVisibility("floating", displayVisibility.floating, { persist: false })
      ]);
      void applyTopmostPolicyToDisplays(topmostPolicy);
      void applyClickThroughToDisplays(clickThroughEnabled);
      void broadcastPreferences();
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
    if (isTaskbarWindow) {
      void listen("tray://taskbar-positioning", (event) => {
        const enabled = Boolean(event.payload);
        taskbarPositionEditMode = enabled;
        void setTaskbarManualPositioning(enabled);
      }).then((unlisten) => {
        disposeTrayPositioningListener = unlisten;
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

    return () => {
      running = false;
      clearInterval(timerId);
      disposeDisplayPersistence();
      disposeTrayPositioningListener();
      disposeDisplayModeListener();
      disposePreferenceSync();
    };
  });
</script>

{#if isMainWindow}
  <main class="page main-page">
    <section class="dashboard">
      <WindowFrame title={t(selectedLanguage, "appTitle")} />
      <div class="content">
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
          <div class="control-stack">
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
          </div>
        </header>

        {#if errorMessage}
          <p class="error">{t(selectedLanguage, "collectFailed")}: {errorMessage}</p>
        {/if}

        <section class="grid compact-two-rows">
          <StatTile
            title={t(selectedLanguage, "cpu")}
            value={loading ? "--" : formatPercent(cpuUsagePercent)}
            subtitle={t(selectedLanguage, "cpuSubtitle")}
            accent={cpuUsagePercent > 70}
          />
          <StatTile
            title={t(selectedLanguage, "memoryUsed")}
            value={loading ? "--" : formatBytes(memoryUsed)}
            subtitle={loading
              ? t(selectedLanguage, "loading")
              : `${t(selectedLanguage, "total")} ${formatBytes(memoryTotal)}`}
          />
          <StatTile
            title={t(selectedLanguage, "swapUsed")}
            value={loading ? "--" : formatBytes(swapUsed)}
            subtitle={loading
              ? t(selectedLanguage, "loading")
              : `${t(selectedLanguage, "total")} ${formatBytes(swapTotal)}`}
          />
          <StatTile
            title={t(selectedLanguage, "diskUsed")}
            value={loading ? "--" : formatBytes(diskUsed)}
            subtitle={loading
              ? t(selectedLanguage, "loading")
              : `${t(selectedLanguage, "total")} ${formatBytes(diskTotal)}`}
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
          <div class="preview-body">
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
              />
            {/if}
          </div>
        </section>
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
      editMode={taskbarPositionEditMode}
      onStartPositioning={handleTaskbarStartPositioning}
      onNudgePosition={handleTaskbarNudge}
      surfaceOpacity={surfaceOpacity}
      frostedBlur={frostedBlur}
    />
  </main>
{:else}
  <main class="display-shell floating-shell" ondblclick={openMainWindow}>
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
    display: flex;
    flex-direction: column;
    gap: 0.54rem;
    padding: 0.62rem 0.72rem 0.68rem;
    flex: 1;
    min-height: 0;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.7rem;
    flex-wrap: wrap;
  }

  .control-stack {
    display: grid;
    gap: 0.32rem;
    justify-items: end;
  }

  .inline-pickers {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
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
    margin-bottom: 0.12rem;
  }

  h1 {
    font-size: clamp(1.1rem, 2vw, 1.76rem);
    letter-spacing: 0.01em;
  }

  .meta {
    margin-top: 0.08rem;
    color: var(--text-subtle);
    font-size: 0.77rem;
  }

  .meta.secondary {
    margin-top: 0.04rem;
    font-size: 0.72rem;
    opacity: 0.92;
  }

  .error {
    color: var(--danger);
    font-size: 0.78rem;
  }

  .grid {
    display: grid;
    gap: 0.5rem;
  }

  .compact-two-rows {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .usage {
    display: grid;
    gap: 0.5rem;
    padding: 0.58rem;
    border-radius: 11px;
    border: 1px solid var(--card-border);
    background: var(--card);
  }

  .preview {
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 0.5rem;
    background: color-mix(in srgb, var(--card) 78%, rgba(6, 12, 19, 0.45));
    display: grid;
    gap: 0.3rem;
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
  }

  :global(html[data-window-role="taskbar"]),
  :global(body[data-window-role="taskbar"]),
  :global(html[data-window-role="floating"]),
  :global(body[data-window-role="floating"]) {
    background: transparent !important;
  }
</style>
