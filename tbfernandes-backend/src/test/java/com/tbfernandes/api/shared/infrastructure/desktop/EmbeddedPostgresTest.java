package com.tbfernandes.api.shared.infrastructure.desktop;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.util.Comparator;
import java.util.Optional;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Runs against a PostgreSQL installed on the machine (TBF_TEST_PG_BIN, or the newest
 * /usr/lib/postgresql/<n>/bin, which GitHub's Ubuntu runners have). Skipped without one, and
 * as root, since initdb refuses to run as root.
 */
class EmbeddedPostgresTest {

	@TempDir
	Path dataDir;

	@Test
	void initializesRestartsAndKeepsData() throws Exception {
		Path bin = postgresBin().orElse(null);
		assumeTrue(bin != null, "no PostgreSQL binaries on this machine");
		assumeTrue(!"root".equals(System.getProperty("user.name")), "initdb does not run as root");

		try (EmbeddedPostgres first = new EmbeddedPostgres(bin, dataDir).start()) {
			try (var connection = DriverManager.getConnection(first.jdbcUrl(), first.username(), first.password());
					var statement = connection.createStatement()) {
				statement.execute("CREATE TABLE kept (value text)");
				statement.execute("INSERT INTO kept VALUES ('ok')");
			}
		}

		try (EmbeddedPostgres second = new EmbeddedPostgres(bin, dataDir).start();
				var connection = DriverManager.getConnection(second.jdbcUrl(), second.username(), second.password());
				var result = connection.createStatement().executeQuery("SELECT value FROM kept")) {
			assertThat(result.next()).isTrue();
			assertThat(result.getString(1)).isEqualTo("ok");
		}
		assertThat(Files.readString(dataDir.resolve("db-password"))).hasSizeGreaterThanOrEqualTo(32);
	}

	private static Optional<Path> postgresBin() throws Exception {
		String configured = System.getenv("TBF_TEST_PG_BIN");
		if (configured != null && !configured.isBlank()) {
			return Optional.of(Path.of(configured));
		}
		Path root = Path.of("/usr/lib/postgresql");
		if (!Files.isDirectory(root)) {
			return Optional.empty();
		}
		try (Stream<Path> versions = Files.list(root)) {
			return versions.map(version -> version.resolve("bin"))
				.filter(dir -> Files.isExecutable(dir.resolve("initdb")))
				.max(Comparator.comparing(dir -> dir.getParent().getFileName().toString(),
						Comparator.comparingInt(Integer::parseInt)));
		}
	}

}
