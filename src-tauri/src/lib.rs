mod monitor;
mod window_contrast;
mod window_policy;

use std::sync::atomic::{AtomicBool, Ordering};

use serde_json::json;
use tauri::Emitter;
use tauri::Manager;
use tauri::menu::{MenuBuilder, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

static DISPLAY_POSITIONING_ENABLED: AtomicBool = AtomicBool::new(false);

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn toggle_display_window(app: &tauri::AppHandle, mode: &str) {
    if let Some(window) = app.get_webview_window(mode) {
        let currently_visible = window.is_visible().unwrap_or(false);
        let next_visible = !currently_visible;

        if next_visible {
            let _ = window.show();
            let _ = window.set_always_on_top(true);
        } else {
            let _ = window.hide();
        }

        let _ = app.emit(
            "app://display-visibility",
            json!({
                "mode": mode,
                "visible": next_visible
            }),
        );
    }
}

fn is_window_visible(app: &tauri::AppHandle, label: &str) -> bool {
    app.get_webview_window(label)
        .and_then(|window| window.is_visible().ok())
        .unwrap_or(false)
}

fn refresh_display_menu_labels(
    app: &tauri::AppHandle,
    taskbar_item: &MenuItem<tauri::Wry>,
    floating_item: &MenuItem<tauri::Wry>,
) {
    let taskbar_text = if is_window_visible(app, "taskbar") {
        "隐藏任务栏窗口"
    } else {
        "显示任务栏窗口"
    };
    let floating_text = if is_window_visible(app, "floating") {
        "隐藏悬浮窗窗口"
    } else {
        "显示悬浮窗窗口"
    };
    let _ = taskbar_item.set_text(taskbar_text);
    let _ = floating_item.set_text(floating_text);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let display_taskbar_item = MenuItem::with_id(
                app,
                "display_taskbar",
                "显示任务栏窗口",
                true,
                None::<&str>,
            )?;
            let display_floating_item = MenuItem::with_id(
                app,
                "display_floating",
                "显示悬浮窗窗口",
                true,
                None::<&str>,
            )?;
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
                .item(&display_taskbar_item)
                .item(&display_floating_item)
                .item(&toggle_taskbar_positioning_item)
                .separator()
                .text("quit_app", "退出")
                .build()?;

            let app_handle = app.handle().clone();
            let toggle_menu_item = toggle_taskbar_positioning_item.clone();
            let taskbar_menu_item = display_taskbar_item.clone();
            let floating_menu_item = display_floating_item.clone();
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
                        DISPLAY_POSITIONING_ENABLED.store(false, Ordering::Relaxed);
                        let _ = app_handle.emit("tray://display-positioning", false);
                        let _ = app_handle.emit("tray://taskbar-positioning", false);
                        let _ = toggle_menu_item.set_text("启动拖动模式");
                        toggle_display_window(&app_handle, "taskbar");
                        refresh_display_menu_labels(
                            &app_handle,
                            &taskbar_menu_item,
                            &floating_menu_item,
                        );
                        show_main_window(&app_handle);
                    }
                    "display_floating" => {
                        DISPLAY_POSITIONING_ENABLED.store(false, Ordering::Relaxed);
                        let _ = app_handle.emit("tray://display-positioning", false);
                        let _ = app_handle.emit("tray://taskbar-positioning", false);
                        let _ = toggle_menu_item.set_text("启动拖动模式");
                        toggle_display_window(&app_handle, "floating");
                        refresh_display_menu_labels(
                            &app_handle,
                            &taskbar_menu_item,
                            &floating_menu_item,
                        );
                        show_main_window(&app_handle);
                    }
                    "toggle_taskbar_positioning" => {
                        let enabled = !DISPLAY_POSITIONING_ENABLED.load(Ordering::Relaxed);
                        DISPLAY_POSITIONING_ENABLED.store(enabled, Ordering::Relaxed);
                        let _ = app_handle.emit("tray://display-positioning", enabled);
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
            refresh_display_menu_labels(app.handle(), &display_taskbar_item, &display_floating_item);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            monitor::commands::get_monitor_snapshot,
            window_contrast::sample_backdrop_luminance,
            window_policy::is_foreground_fullscreen
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
