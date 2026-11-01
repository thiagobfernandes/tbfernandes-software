// No console window next to the app in release builds on Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backend;

use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

fn main() {
    tauri::Builder::default()
        // A second launch focuses the window that is already open.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            WebviewWindowBuilder::new(app, "splash", WebviewUrl::App("desktop-splash.html".into()))
                .title("TBFernandes")
                .inner_size(420.0, 260.0)
                .resizable(false)
                .decorations(false)
                .center()
                .build()?;
            let handle = app.handle().clone();
            std::thread::spawn(move || match backend::start(&handle) {
                Ok(backend) => open_main_window(handle, backend),
                Err(message) => fail(&handle, &message),
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build the app")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                if let Some(backend) = app.try_state::<backend::Backend>() {
                    backend.shutdown();
                }
            }
        });
}

/// The frontend reads the backend's address and token from window.__TBF_DESKTOP__
/// (tbfernandes-frontend/src/lib/env.ts), set before any of its scripts run.
fn open_main_window(handle: AppHandle, backend: backend::Backend) {
    let script = format!(
        "window.__TBF_DESKTOP__ = Object.freeze({{ apiUrl: \"{}\", token: \"{}\" }});",
        backend.api_url(),
        backend.token()
    );
    handle.manage(backend);
    let app = handle.clone();
    let _ = handle.run_on_main_thread(move || {
        let built = WebviewWindowBuilder::new(&app, "main", WebviewUrl::App("index.html".into()))
            .title("TBFernandes")
            .inner_size(1360.0, 860.0)
            .min_inner_size(900.0, 600.0)
            .maximized(true)
            .initialization_script(&script)
            .build();
        match built {
            // Close the splash only after the main window exists, or the app would exit.
            Ok(_) => {
                if let Some(splash) = app.get_webview_window("splash") {
                    let _ = splash.close();
                }
            }
            // A blocking dialog cannot wait on the main thread it runs on.
            Err(error) => {
                let message = format!("Não foi possível abrir a janela: {error}");
                std::thread::spawn(move || fail(&app, &message));
            }
        }
    });
}

fn fail(handle: &AppHandle, message: &str) {
    let folder = backend::data_dir(handle)
        .map(|dir| dir.join("logs").display().to_string())
        .unwrap_or_default();
    handle
        .dialog()
        .message(format!("{message}\n\nLogs: {folder}"))
        .title("TBFernandes não conseguiu abrir")
        .kind(MessageDialogKind::Error)
        .blocking_show();
    handle.exit(1);
}
