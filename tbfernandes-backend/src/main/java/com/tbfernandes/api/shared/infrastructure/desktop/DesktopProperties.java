package com.tbfernandes.api.shared.infrastructure.desktop;

import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * tbf.desktop.*, set by the Windows app when it starts the backend (profile desktop).
 * <ul>
 * <li>data-dir: where the database, logs and backups live (TBF_DATA_DIR).</li>
 * <li>postgres-bin: the bundled PostgreSQL bin directory (TBF_PG_BIN).</li>
 * <li>token: secret created for each launch; every request must send it in
 * X-TBF-Desktop-Token (TBF_DESKTOP_TOKEN).</li>
 * <li>parent-pid: the app's process; the backend exits when it is gone (TBF_PARENT_PID).</li>
 * </ul>
 */
@ConfigurationProperties("tbf.desktop")
public record DesktopProperties(Path dataDir, Path postgresBin, String token, Long parentPid) {

	void validate() {
		if (blank(dataDir) || blank(postgresBin)) {
			throw new IllegalStateException("The desktop profile needs TBF_DATA_DIR and TBF_PG_BIN");
		}
		if (token == null || token.length() < 32) {
			throw new IllegalStateException("The desktop profile needs TBF_DESKTOP_TOKEN with at least 32 characters");
		}
	}

	private static boolean blank(Path path) {
		return path == null || path.toString().isBlank();
	}

}
