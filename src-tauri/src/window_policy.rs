#[cfg(target_os = "windows")]
mod imp {
    use windows_sys::Win32::Foundation::RECT;
    use windows_sys::Win32::Graphics::Gdi::{GetMonitorInfoW, MonitorFromWindow, MONITOR_DEFAULTTONEAREST, MONITORINFO};
    use windows_sys::Win32::System::Threading::GetCurrentProcessId;
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowLongPtrW, GetWindowRect, GetWindowThreadProcessId,
        GWL_STYLE, WS_CAPTION, WS_POPUP, WS_THICKFRAME,
    };

    pub fn is_foreground_fullscreen() -> bool {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.is_null() {
                return false;
            }

            let mut owner_pid = 0u32;
            let _ = GetWindowThreadProcessId(hwnd, &mut owner_pid);
            if owner_pid == GetCurrentProcessId() {
                return false;
            }

            let mut window_rect = RECT {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            };
            if GetWindowRect(hwnd, &mut window_rect) == 0 {
                return false;
            }

            let monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
            if monitor.is_null() {
                return false;
            }

            let mut monitor_info = MONITORINFO {
                cbSize: std::mem::size_of::<MONITORINFO>() as u32,
                rcMonitor: RECT {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                },
                rcWork: RECT {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                },
                dwFlags: 0,
            };
            if GetMonitorInfoW(monitor, &mut monitor_info as *mut MONITORINFO as *mut _) == 0 {
                return false;
            }

            // Fullscreen detection is intentionally strict to avoid false positives.
            // 1) Window must cover monitor bounds with small tolerance.
            // 2) Window should be borderless/popup-like (not normal maximized frame window).
            const TOLERANCE: i32 = 2;
            let covers_monitor = window_rect.left <= monitor_info.rcMonitor.left + TOLERANCE
                && window_rect.top <= monitor_info.rcMonitor.top + TOLERANCE
                && window_rect.right >= monitor_info.rcMonitor.right - TOLERANCE
                && window_rect.bottom >= monitor_info.rcMonitor.bottom - TOLERANCE;

            if !covers_monitor {
                return false;
            }

            let style = GetWindowLongPtrW(hwnd, GWL_STYLE) as u32;
            let borderless = (style & (WS_CAPTION | WS_THICKFRAME)) == 0;
            let popup_like = (style & WS_POPUP) != 0;
            borderless || popup_like
        }
    }
}

#[cfg(not(target_os = "windows"))]
mod imp {
    pub fn is_foreground_fullscreen() -> bool {
        false
    }
}

#[tauri::command]
pub fn is_foreground_fullscreen() -> bool {
    imp::is_foreground_fullscreen()
}
