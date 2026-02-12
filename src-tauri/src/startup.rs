#[cfg(target_os = "windows")]
mod imp {
    use std::path::PathBuf;

    use winreg::RegKey;
    use winreg::enums::{HKEY_CURRENT_USER, KEY_READ, KEY_WRITE};

    const RUN_KEY_PATH: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
    const VALUE_NAME: &str = "ResourceMonitor";

    fn run_key_for_read() -> Result<RegKey, String> {
        RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags(RUN_KEY_PATH, KEY_READ)
            .map_err(|error| format!("open run key failed: {error}"))
    }

    fn run_key_for_write() -> Result<RegKey, String> {
        RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags(RUN_KEY_PATH, KEY_READ | KEY_WRITE)
            .map_err(|error| format!("open run key failed: {error}"))
    }

    fn current_executable_path() -> Result<PathBuf, String> {
        std::env::current_exe().map_err(|error| format!("resolve executable path failed: {error}"))
    }

    fn startup_command_value() -> Result<String, String> {
        let executable = current_executable_path()?;
        Ok(format!("\"{}\" --autostart", executable.display()))
    }

    pub fn get_launch_at_startup_enabled() -> Result<bool, String> {
        let run_key = run_key_for_read()?;
        let startup_value = match run_key.get_value::<String, _>(VALUE_NAME) {
            Ok(value) => value,
            Err(_) => return Ok(false),
        };

        let executable = current_executable_path()?;
        let executable_text = executable.to_string_lossy().to_string();
        Ok(startup_value.contains(&executable_text))
    }

    pub fn set_launch_at_startup_enabled(enabled: bool) -> Result<(), String> {
        let run_key = run_key_for_write()?;
        if enabled {
            let startup_value = startup_command_value()?;
            run_key
                .set_value(VALUE_NAME, &startup_value)
                .map_err(|error| format!("set startup value failed: {error}"))?;
            return Ok(());
        }

        match run_key.delete_value(VALUE_NAME) {
            Ok(_) => Ok(()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(format!("delete startup value failed: {error}")),
        }
    }
}

#[cfg(not(target_os = "windows"))]
mod imp {
    pub fn get_launch_at_startup_enabled() -> Result<bool, String> {
        Ok(false)
    }

    pub fn set_launch_at_startup_enabled(enabled: bool) -> Result<(), String> {
        if enabled {
            return Err(String::from("launch at startup is only supported on Windows"));
        }
        Ok(())
    }
}

#[tauri::command]
pub fn get_launch_at_startup_enabled() -> Result<bool, String> {
    imp::get_launch_at_startup_enabled()
}

#[tauri::command]
pub fn set_launch_at_startup_enabled(enabled: bool) -> Result<(), String> {
    imp::set_launch_at_startup_enabled(enabled)
}
