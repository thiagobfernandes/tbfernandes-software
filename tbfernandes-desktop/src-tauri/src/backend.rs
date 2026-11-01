//! The Spring Boot backend, started in the background with the bundled Java runtime.
//! It runs the `desktop` profile (tbfernandes-backend, docs/desktop.md): its own PostgreSQL,
//! 127.0.0.1 only, and every request must carry the launch token.

use std::fs::{self, File};
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager};

const TOKEN_HEADER: &str = "X-TBF-Desktop-Token";
const STARTUP_TIMEOUT: Duration = Duration::from_secs(180);
const SHUTDOWN_TIMEOUT: Duration = Duration::from_secs(20);

pub struct Backend {
    child: Mutex<Option<Child>>,
    port: u16,
    token: String,
}

/// Where the app keeps its database, logs and backups: %LOCALAPPDATA%\TBFernandes.
pub fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .local_data_dir()
        .map(|dir| dir.join("TBFernandes"))
        .map_err(|e| format!("Pasta de dados não encontrada: {e}"))
}

/// Daily backups (zip of the database) go where the user sees them: Documents\TBFernandes\backups.
pub fn backup_dir(app: &AppHandle, data: &Path) -> PathBuf {
    app.path()
        .document_dir()
        .map(|dir| dir.join("TBFernandes").join("backups"))
        .unwrap_or_else(|_| data.join("backups"))
}

/// Starts the backend and waits until it answers. The error is a message for the user.
pub fn start(app: &AppHandle) -> Result<Backend, String> {
    let resources = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Pasta do aplicativo não encontrada: {e}"))?;
    let data = data_dir(app)?;
    let logs = data.join("logs");
    fs::create_dir_all(&logs)
        .map_err(|e| format!("Não foi possível criar {}: {e}", logs.display()))?;

    // `tauri dev` has no bundled resources: TBF_DESKTOP_JAVA, _JAR and _PG_BIN point elsewhere.
    let java = override_or(
        "TBF_DESKTOP_JAVA",
        resources.join("runtime").join("bin").join(exe("java")),
    );
    let jar = override_or(
        "TBF_DESKTOP_JAR",
        resources.join("backend").join("tbfernandes-api.jar"),
    );
    let pg_bin = override_or("TBF_DESKTOP_PG_BIN", resources.join("postgres").join("bin"));
    for (what, path) in [("Java", &java), ("backend", &jar), ("PostgreSQL", &pg_bin)] {
        if !path.exists() {
            return Err(format!(
                "Arquivo do {what} não encontrado: {}. Reinstale o aplicativo.",
                path.display()
            ));
        }
    }

    let port = free_port().map_err(|e| format!("Nenhuma porta livre: {e}"))?;
    let token = new_token()?;
    let console = File::create(logs.join("backend-console.log"))
        .map_err(|e| format!("Não foi possível criar o log: {e}"))?;
    let console_err = console.try_clone().map_err(|e| e.to_string())?;

    let mut command = Command::new(&java);
    command
        .args([
            "-Xms64m",
            "-Xmx512m",
            "-XX:TieredStopAtLevel=1",
            // Class data sharing archive, written on the first run: later starts are faster.
            "-XX:+AutoCreateSharedArchive",
        ])
        .arg(format!(
            "-XX:SharedArchiveFile={}",
            data.join("backend.jsa").display()
        ))
        .arg("-jar")
        .arg(&jar)
        .arg("--spring.profiles.active=desktop")
        .env("TBF_PORT", port.to_string())
        .env("TBF_DATA_DIR", &data)
        .env("TBF_PG_BIN", &pg_bin)
        .env("TBF_DESKTOP_TOKEN", &token)
        .env("TBF_PARENT_PID", std::process::id().to_string())
        .env("TBF_APP_VERSION", app.package_info().version.to_string())
        .env("TBF_BACKUP_DIR", backup_dir(app, &data))
        .env_remove("JAVA_TOOL_OPTIONS")
        .env_remove("SPRING_PROFILES_ACTIVE")
        .stdin(Stdio::null())
        .stdout(console)
        .stderr(console_err);
    hide_console(&mut command);

    let child = command
        .spawn()
        .map_err(|e| format!("Não foi possível iniciar o backend: {e}"))?;
    let backend = Backend {
        child: Mutex::new(Some(child)),
        port,
        token,
    };
    backend.wait_until_ready(&logs)?;
    Ok(backend)
}

impl Backend {
    pub fn api_url(&self) -> String {
        format!("http://127.0.0.1:{}", self.port)
    }

    pub fn token(&self) -> &str {
        &self.token
    }

    fn wait_until_ready(&self, logs: &Path) -> Result<(), String> {
        let health = format!("{}/actuator/health", self.api_url());
        let started = Instant::now();
        while started.elapsed() < STARTUP_TIMEOUT {
            if let Some(status) = self.exit_status() {
                return Err(format!(
                    "O backend parou ao iniciar ({status}). Veja {}",
                    logs.join("backend.log").display()
                ));
            }
            let answer = ureq::get(&health)
                .header(TOKEN_HEADER, &self.token)
                .config()
                .timeout_global(Some(Duration::from_secs(2)))
                .build()
                .call();
            if matches!(answer, Ok(ref response) if response.status() == 200) {
                return Ok(());
            }
            thread::sleep(Duration::from_millis(300));
        }
        self.kill();
        Err(format!(
            "O backend não respondeu em {} s. Veja {}",
            STARTUP_TIMEOUT.as_secs(),
            logs.join("backend.log").display()
        ))
    }

    /// Asks the backend to stop (it stops PostgreSQL cleanly), then waits; kills it as a last resort.
    pub fn shutdown(&self) {
        if self.exit_status().is_some() {
            return;
        }
        let _ = ureq::post(&format!("{}/api/v1/desktop/shutdown", self.api_url()))
            .header(TOKEN_HEADER, &self.token)
            .config()
            .timeout_global(Some(Duration::from_secs(5)))
            .build()
            .send_empty();
        let started = Instant::now();
        while started.elapsed() < SHUTDOWN_TIMEOUT {
            if self.exit_status().is_some() {
                return;
            }
            thread::sleep(Duration::from_millis(200));
        }
        // PostgreSQL may be left running; the backend stops it on the next launch.
        self.kill();
    }

    fn exit_status(&self) -> Option<std::process::ExitStatus> {
        let mut guard = self.child.lock().ok()?;
        match guard.as_mut()?.try_wait() {
            Ok(Some(status)) => Some(status),
            _ => None,
        }
    }

    fn kill(&self) {
        if let Ok(mut guard) = self.child.lock() {
            if let Some(child) = guard.as_mut() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

fn override_or(variable: &str, default: PathBuf) -> PathBuf {
    std::env::var_os(variable)
        .map(PathBuf::from)
        .unwrap_or(default)
}

fn exe(name: &str) -> String {
    if cfg!(windows) {
        format!("{name}.exe")
    } else {
        name.to_string()
    }
}

fn free_port() -> std::io::Result<u16> {
    Ok(TcpListener::bind(("127.0.0.1", 0))?.local_addr()?.port())
}

fn new_token() -> Result<String, String> {
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes).map_err(|e| format!("Sem fonte de aleatoriedade: {e}"))?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}

#[cfg(windows)]
fn hide_console(command: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    command.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
fn hide_console(_command: &mut Command) {}
