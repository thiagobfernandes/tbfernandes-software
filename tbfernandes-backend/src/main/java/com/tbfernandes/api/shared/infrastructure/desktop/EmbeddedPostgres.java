package com.tbfernandes.api.shared.infrastructure.desktop;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The PostgreSQL server of the desktop app, run from the binaries shipped with it (bin
 * directory with initdb and pg_ctl).
 * <ul>
 * <li>First start: initdb in {@code <dataDir>/pg} with a random password kept in
 * {@code <dataDir>/db-password}, listening only on 127.0.0.1, and the database created.</li>
 * <li>Every start: a free port, and a server left over by a crash is stopped first.</li>
 * <li>{@link #stop()} shuts it down (fast mode: open transactions roll back).</li>
 * </ul>
 * The migrations stay the same as on the server: it is the same PostgreSQL.
 */
public final class EmbeddedPostgres implements AutoCloseable {

	private static final Logger log = LoggerFactory.getLogger(EmbeddedPostgres.class);

	static final String USER = "tbf";

	static final String DATABASE = "tbfernandes";

	private static final boolean WINDOWS = System.getProperty("os.name", "").toLowerCase().startsWith("windows");

	private static final Duration TIMEOUT = Duration.ofSeconds(90);

	private final Path bin;

	private final Path pgData;

	private final Path logs;

	private final Path passwordFile;

	private int port;

	private String password;

	private boolean running;

	public EmbeddedPostgres(Path bin, Path dataDir) {
		this.bin = bin;
		this.pgData = dataDir.resolve("pg");
		this.logs = dataDir.resolve("logs");
		this.passwordFile = dataDir.resolve("db-password");
	}

	public synchronized EmbeddedPostgres start() {
		if (running) {
			return this;
		}
		try {
			Files.createDirectories(logs);
			if (!Files.exists(pgData.resolve("PG_VERSION"))) {
				initialize();
			}
			password = Files.readString(passwordFile, StandardCharsets.UTF_8).strip();
			stopLeftover();
			port = freePort();
			run(List.of(tool("pg_ctl"), "start", "-D", pgData.toString(), "-w", "-t", timeoutSeconds(), "-l",
					logs.resolve("postgres.log").toString(), "-o", "-p " + port), "pg_ctl-start.log");
			running = true;
			createDatabase();
			log.info("Embedded PostgreSQL on 127.0.0.1:{} ({})", port, pgData);
			return this;
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Could not start the embedded PostgreSQL", ex);
		}
	}

	public synchronized void stop() {
		if (!running) {
			return;
		}
		try {
			run(List.of(tool("pg_ctl"), "stop", "-D", pgData.toString(), "-m", "fast", "-w", "-t", timeoutSeconds()),
					"pg_ctl-stop.log");
			log.info("Embedded PostgreSQL stopped");
		}
		catch (IOException | IllegalStateException ex) {
			log.warn("Could not stop the embedded PostgreSQL", ex);
		}
		finally {
			running = false;
		}
	}

	@Override
	public void close() {
		stop();
	}

	public String jdbcUrl() {
		return "jdbc:postgresql://127.0.0.1:" + port + "/" + DATABASE;
	}

	public String username() {
		return USER;
	}

	public String password() {
		return password;
	}

	public int port() {
		return port;
	}

	private void initialize() throws IOException {
		log.info("Creating the embedded PostgreSQL data directory {}", pgData);
		Files.createDirectories(pgData.getParent());
		byte[] random = new byte[24];
		new SecureRandom().nextBytes(random);
		String secret = HexFormat.of().formatHex(random);
		Files.writeString(passwordFile, secret, StandardCharsets.UTF_8);
		restrictToOwner(passwordFile);
		// initdb reads the password from a file so it never shows in the process list.
		Path pwfile = Files.createTempFile(pgData.getParent(), "initdb", ".tmp");
		try {
			Files.writeString(pwfile, secret, StandardCharsets.UTF_8);
			// Locale C: the same behavior on every Windows language; text search uses 'simple'.
			run(List.of(tool("initdb"), "-D", pgData.toString(), "-U", USER, "--pwfile=" + pwfile, "-E", "UTF8",
					"--locale=C", "--auth=scram-sha-256"), "initdb.log");
		}
		finally {
			Files.deleteIfExists(pwfile);
		}
		Files.writeString(pgData.resolve("postgresql.conf"), """

				# TBFernandes desktop: local connections over TCP only.
				listen_addresses = '127.0.0.1'
				unix_socket_directories = ''
				""", StandardCharsets.UTF_8, StandardOpenOption.APPEND);
	}

	/** A server still running from a previous launch that did not shut down cleanly. */
	private void stopLeftover() throws IOException {
		if (!Files.exists(pgData.resolve("postmaster.pid"))) {
			return;
		}
		int status = exec(List.of(tool("pg_ctl"), "status", "-D", pgData.toString()), "pg_ctl-status.log");
		if (status == 0) {
			log.info("Stopping a PostgreSQL left running by a previous launch");
			run(List.of(tool("pg_ctl"), "stop", "-D", pgData.toString(), "-m", "fast", "-w", "-t", timeoutSeconds()),
					"pg_ctl-stop.log");
		}
	}

	private void createDatabase() {
		String url = "jdbc:postgresql://127.0.0.1:" + port + "/postgres";
		try (Connection connection = DriverManager.getConnection(url, USER, password);
				var exists = connection.prepareStatement("SELECT 1 FROM pg_database WHERE datname = ?")) {
			exists.setString(1, DATABASE);
			if (!exists.executeQuery().next()) {
				try (var create = connection.createStatement()) {
					create.execute("CREATE DATABASE " + DATABASE + " ENCODING 'UTF8'");
				}
				log.info("Database {} created", DATABASE);
			}
		}
		catch (SQLException ex) {
			throw new IllegalStateException("Could not create the database " + DATABASE, ex);
		}
	}

	private String tool(String name) {
		Path path = bin.resolve(WINDOWS ? name + ".exe" : name);
		if (!Files.isExecutable(path)) {
			throw new IllegalStateException("PostgreSQL binary not found: " + path + " (tbf.desktop.postgres-bin)");
		}
		return path.toString();
	}

	private void run(List<String> command, String logName) throws IOException {
		int exit = exec(command, logName);
		if (exit != 0) {
			throw new IllegalStateException(
					"'" + String.join(" ", command.subList(0, 2)) + "' exited with " + exit + "; see " + logs.resolve(logName));
		}
	}

	private int exec(List<String> command, String logName) throws IOException {
		Process process = new ProcessBuilder(command).redirectErrorStream(true)
			.redirectOutput(logs.resolve(logName).toFile())
			.start();
		try {
			if (!process.waitFor(TIMEOUT.toSeconds() + 10, TimeUnit.SECONDS)) {
				process.destroyForcibly();
				throw new IllegalStateException("'" + String.join(" ", command.subList(0, 2)) + "' timed out");
			}
			return process.exitValue();
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			process.destroyForcibly();
			throw new IllegalStateException("Interrupted while running " + command.get(0), ex);
		}
	}

	private static String timeoutSeconds() {
		return Long.toString(TIMEOUT.toSeconds());
	}

	private static int freePort() throws IOException {
		try (ServerSocket socket = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			return socket.getLocalPort();
		}
	}

	private static void restrictToOwner(Path file) throws IOException {
		if (!WINDOWS) {
			Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("rw-------"));
		}
		// On Windows the file lives under %LOCALAPPDATA%, which only the user can read.
	}

}
