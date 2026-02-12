mod monitor;
mod window_policy;

use std::sync::atomic::{AtomicBool, Ordering};

use tauri::Emitter;
use tauri::Manager;
use tauri::menu::{MenuBuilder, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

static TASKBAR_POSITIONING_ENABLED: AtomicBool = AtomicBool::new(false);

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn set_display_mode(app: &tauri::AppHandle, mode: &str) {
    let taskbar_window = app.get_webview_window("taskbar");
    let floating_window = app.get_webview_window("floating");

    match mode {
        "taskbar" => {
            if let Some(window) = taskbar_window {
                let _ = window.show();
                let _ = window.set_always_on_top(true);
            }
            if let Some(window) = floating_window {
                let _ = window.hide();
            }
        }
        "floating" => {
            if let Some(window) = floating_window {
                let _ = window.show();
                let _ = window.set_always_on_top(true);
            }
            if let Some(window) = taskbar_window {
                let _ = window.hide();
            }
        }
        _ => {}
    }

    let _ = app.emit("tray://display-mode", mode);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let toggle_taskbar_positioning_item = MenuItem::with_id(
                app,
                "toggle_taskbar_positioning",
                "启动拖动模式",
                true,
                None::<&str>,
            )?;
            let tray_menu = MenuBuilder::new(app)
                .text("show_main", "打开主窗口")
                .separator()
                .text("display_taskbar", "显示任务栏模式")
                .text("display_floating", "显示悬浮窗模式")
                .item(&toggle_taskbar_positioning_item)
                .separator()
                .text("quit_app", "退出")
                .build()?;

            let app_handle = app.handle().clone();
            let toggle_menu_item = toggle_taskbar_positioning_item.clone();
            let mut tray_builder = TrayIconBuilder::new()
                .menu(&tray_menu)
                .tooltip("Resource Monitor")
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(&tray.app_handle());
                    }
                })
                .on_menu_event(move |_, event| match event.id().as_ref() {
                    "show_main" => show_main_window(&app_handle),
                    "display_taskbar" => {
                        TASKBAR_POSITIONING_ENABLED.store(false, Ordering::Relaxed);
                        let _ = toggle_menu_item.set_text("启动拖动模式");
                        set_display_mode(&app_handle, "taskbar");
                        show_main_window(&app_handle);
                    }
                    "display_floating" => {
                        TASKBAR_POSITIONING_ENABLED.store(false, Ordering::Relaxed);
                        let _ = app_handle.emit("tray://taskbar-positioning", false);
                        let _ = toggle_menu_item.set_text("启动拖动模式");
                        set_display_mode(&app_handle, "floating");
                        show_main_window(&app_handle);
                    }
                    "toggle_taskbar_positioning" => {
                        let enabled = !TASKBAR_POSITIONING_ENABLED.load(Ordering::Relaxed);
                        TASKBAR_POSITIONING_ENABLED.store(enabled, Ordering::Relaxed);
                        let _ = app_handle.emit("tray://taskbar-positioning", enabled);
                        let _ = toggle_menu_item.set_text(if enabled {
                            "退出拖动模式"
                        } else {
                            "启动拖动模式"
                        });
                        show_main_window(&app_handle);
                    }
                    "quit_app" => app_handle.exit(0),
                    _ => {}
                });

            if let Some(default_icon) = app.default_window_icon().cloned() {
                tray_builder = tray_builder.icon(default_icon);
            }

            tray_builder.build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            monitor::commands::get_monitor_snapshot,
            window_policy::is_foreground_fullscreen
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
