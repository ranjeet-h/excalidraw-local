use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;

use tauri::{Emitter, Manager, State};

#[derive(Default)]
struct PendingOpenFiles(Mutex<Vec<String>>);

const OPEN_FILES_EVENT: &str = "workspace://open-files";

fn is_supported_document_path(path: &Path) -> bool {
    if !path.is_file() {
        return false;
    }

    matches!(
        path.extension().and_then(|extension| extension.to_str()),
        Some("excalidraw" | "json")
    )
}

fn resolve_openable_paths<I>(args: I, cwd: Option<&Path>) -> Vec<String>
where
    I: IntoIterator,
    I::Item: AsRef<str>,
{
    args.into_iter()
        .filter_map(|arg| {
            let candidate = arg.as_ref().trim();

            if candidate.is_empty() || candidate.starts_with('-') {
                return None;
            }

            let path = PathBuf::from(candidate);
            let resolved_path = if path.is_absolute() {
                path
            } else if let Some(cwd) = cwd {
                cwd.join(path)
            } else {
                path
            };

            if !is_supported_document_path(&resolved_path) {
                return None;
            }

            Some(resolved_path.to_string_lossy().into_owned())
        })
        .collect()
}

fn store_pending_open_files(app: &tauri::AppHandle, file_paths: &[String]) {
    if file_paths.is_empty() {
        return;
    }

    if let Ok(mut pending_files) = app.state::<PendingOpenFiles>().0.lock() {
        pending_files.extend(file_paths.iter().cloned());
    }
}

#[tauri::command]
fn consume_pending_open_files(state: State<'_, PendingOpenFiles>) -> Result<Vec<String>, String> {
    let mut pending_files = state
        .0
        .lock()
        .map_err(|_| "Could not access the pending file-open queue.".to_string())?;

    let file_paths = pending_files.clone();
    pending_files.clear();

    Ok(file_paths)
}

#[tauri::command]
fn reveal_in_folder(path: String) -> Result<(), String> {
    let target = PathBuf::from(&path);

    if !target.exists() {
        return Err(format!("The file does not exist: {}", path));
    }

    let status = if cfg!(target_os = "macos") {
        Command::new("open").args(["-R", &path]).status()
    } else if cfg!(target_os = "windows") {
        Command::new("explorer").args(["/select,", &path]).status()
    } else {
        let parent = target
            .parent()
            .ok_or_else(|| format!("Could not determine the containing folder for {}", path))?;

        Command::new("xdg-open").arg(parent).status()
    };

    match status {
        Ok(status) if status.success() => Ok(()),
        Ok(status) => Err(format!(
            "The system file manager exited with status {}.",
            status
        )),
        Err(error) => Err(format!("Could not reveal the file in the system file manager: {}", error)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            let cwd_path = Path::new(&cwd);
            let file_paths = resolve_openable_paths(args.iter().skip(1), Some(cwd_path));

            store_pending_open_files(app, &file_paths);

            if !file_paths.is_empty() {
                let _ = app.emit(OPEN_FILES_EVENT, file_paths);
            }

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .manage(PendingOpenFiles::default())
        .setup(|app| {
            let cwd = std::env::current_dir().ok();
            let file_paths = resolve_openable_paths(std::env::args().skip(1), cwd.as_deref());

            store_pending_open_files(app.handle(), &file_paths);

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            consume_pending_open_files,
            reveal_in_folder
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
