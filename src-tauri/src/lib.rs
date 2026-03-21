use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      #[cfg(not(debug_assertions))]
      {
        let app_data_dir = app.path().app_data_dir().expect("Failed to locate app data directory");
        let db_path = app_data_dir.join("database_storage");
        std::fs::create_dir_all(&db_path).expect("Failed to create database directory");

        let db_sidecar = app
          .shell()
          .sidecar("mongod")
          .expect("Failed to initialize mongod sidecar")
          .args([
            "--dbpath", &db_path.to_string_lossy(),
            "--port", "27017",
            "--bind_ip", "127.0.0.1",
            "--journal"
          ]);

        db_sidecar.spawn().expect("Failed to spawn MongoDB process");

        let node_sidecar = app
          .shell()
          .sidecar("backend")
          .expect("Failed to initialize Node backend sidecar")
          .args(["--port", "3001"]);

        node_sidecar.spawn().expect("Failed to spawn Node process");
      }

      #[cfg(debug_assertions)]
      {
        println!("Development mode active. Sidecars are bypassed. Using external services.");
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("Error while running Tauri application");
}
