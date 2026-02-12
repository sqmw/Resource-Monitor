<script>
  import { onMount } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";

  let { title } = $props();

  const appWindow = getCurrentWindow();
  let maximized = $state(false);

  onMount(async () => {
    maximized = await appWindow.isMaximized();
  });

  async function minimizeWindow() {
    await appWindow.minimize();
  }

  async function toggleMaximizeWindow() {
    await appWindow.toggleMaximize();
    maximized = await appWindow.isMaximized();
  }

  async function closeWindow() {
    await appWindow.close();
  }
</script>

<header class="titlebar">
  <div class="drag-area" data-tauri-drag-region>
    <span class="brand-dot"></span>
    <p>{title}</p>
  </div>
  <div class="actions">
    <button type="button" onclick={minimizeWindow} aria-label="最小化窗口">_</button>
    <button type="button" onclick={toggleMaximizeWindow} aria-label="切换窗口状态">
      {maximized ? "□" : "▢"}
    </button>
    <button class="danger" type="button" onclick={closeWindow} aria-label="关闭窗口">×</button>
  </div>
</header>

<style>
  .titlebar {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom: 1px solid var(--card-border);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.15));
    padding: 0 0.35rem 0 0.8rem;
    border-top-left-radius: 14px;
    border-top-right-radius: 14px;
    overflow: hidden;
  }

  .drag-area {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex: 1;
    min-width: 0;
  }

  .brand-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 0 14px var(--accent);
    flex-shrink: 0;
  }

  p {
    color: var(--text-main);
    font-weight: 600;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .actions {
    height: 100%;
    display: flex;
    align-items: stretch;
  }

  .actions button {
    width: 38px;
    color: var(--text-main);
    font-size: 1rem;
    background: transparent;
    transition: background-color 150ms ease;
  }

  .actions button:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .actions button.danger:hover {
    background: rgba(255, 92, 92, 0.82);
  }
</style>
