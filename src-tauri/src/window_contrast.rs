#[cfg(target_os = "windows")]
mod imp {
    use windows_sys::Win32::Graphics::Gdi::{GetDC, GetPixel, ReleaseDC};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        GetSystemMetrics, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN, SM_XVIRTUALSCREEN,
        SM_YVIRTUALSCREEN,
    };

    const PIXEL_INVALID: u32 = u32::MAX;
    const SAMPLE_MARGIN: i32 = 8;

    struct ScreenBounds {
        left: i32,
        top: i32,
        right: i32,
        bottom: i32,
    }

    impl ScreenBounds {
        fn detect() -> Option<Self> {
            unsafe {
                let left = GetSystemMetrics(SM_XVIRTUALSCREEN);
                let top = GetSystemMetrics(SM_YVIRTUALSCREEN);
                let width = GetSystemMetrics(SM_CXVIRTUALSCREEN);
                let height = GetSystemMetrics(SM_CYVIRTUALSCREEN);
                if width <= 0 || height <= 0 {
                    return None;
                }

                Some(Self {
                    left,
                    top,
                    right: left + width - 1,
                    bottom: top + height - 1,
                })
            }
        }

        fn clamp_point(&self, x: i32, y: i32) -> (i32, i32) {
            (x.clamp(self.left, self.right), y.clamp(self.top, self.bottom))
        }
    }

    fn colorref_luminance(color: u32) -> f32 {
        let red = (color & 0xFF) as f32;
        let green = ((color >> 8) & 0xFF) as f32;
        let blue = ((color >> 16) & 0xFF) as f32;
        0.2126 * red + 0.7152 * green + 0.0722 * blue
    }

    pub fn sample_backdrop_luminance(x: i32, y: i32, width: i32, height: i32) -> Option<u8> {
        if width <= 0 || height <= 0 {
            return None;
        }

        let bounds = ScreenBounds::detect()?;
        let mid_x = x + width / 2;
        let mid_y = y + height / 2;

        let sample_points = [
            (x - SAMPLE_MARGIN, y - SAMPLE_MARGIN),
            (mid_x, y - SAMPLE_MARGIN),
            (x + width + SAMPLE_MARGIN, y - SAMPLE_MARGIN),
            (x - SAMPLE_MARGIN, mid_y),
            (x + width + SAMPLE_MARGIN, mid_y),
            (x - SAMPLE_MARGIN, y + height + SAMPLE_MARGIN),
            (mid_x, y + height + SAMPLE_MARGIN),
            (x + width + SAMPLE_MARGIN, y + height + SAMPLE_MARGIN),
        ];

        unsafe {
            let desktop_dc = GetDC(std::ptr::null_mut());
            if desktop_dc.is_null() {
                return None;
            }

            let mut luminance_total = 0.0f32;
            let mut sample_count = 0.0f32;

            for (sample_x, sample_y) in sample_points {
                let (clamped_x, clamped_y) = bounds.clamp_point(sample_x, sample_y);
                let color = GetPixel(desktop_dc, clamped_x, clamped_y);
                if color == PIXEL_INVALID {
                    continue;
                }

                luminance_total += colorref_luminance(color);
                sample_count += 1.0;
            }

            let _ = ReleaseDC(std::ptr::null_mut(), desktop_dc);

            if sample_count == 0.0 {
                return None;
            }

            Some((luminance_total / sample_count).round().clamp(0.0, 255.0) as u8)
        }
    }
}

#[cfg(not(target_os = "windows"))]
mod imp {
    pub fn sample_backdrop_luminance(_: i32, _: i32, _: i32, _: i32) -> Option<u8> {
        None
    }
}

#[tauri::command]
pub fn sample_backdrop_luminance(x: i32, y: i32, width: i32, height: i32) -> Option<u8> {
    imp::sample_backdrop_luminance(x, y, width, height)
}
