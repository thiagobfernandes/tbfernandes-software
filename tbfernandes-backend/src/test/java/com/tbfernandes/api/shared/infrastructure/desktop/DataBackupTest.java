package com.tbfernandes.api.shared.infrastructure.desktop;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipFile;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class DataBackupTest {

	@TempDir
	Path dir;

	Path pgData;

	Path backups;

	Instant now = Instant.parse("2026-11-01T10:00:00Z");

	@BeforeEach
	void dataDirectory() throws Exception {
		pgData = Files.createDirectories(dir.resolve("pg"));
		Files.writeString(pgData.resolve("PG_VERSION"), "17");
		Files.createDirectories(pgData.resolve("base/1"));
		Files.writeString(pgData.resolve("base/1/1259"), "table data");
		Files.writeString(pgData.resolve("postmaster.pid"), "1234");
		backups = dir.resolve("backups");
	}

	@Test
	void zipsTheDataDirectoryWithoutTheServerPidFile() throws Exception {
		backup("1.0.0").runIfDue(pgData);

		List<Path> files = backup("1.0.0").backups();
		assertThat(files).hasSize(1);
		try (ZipFile zip = new ZipFile(files.getFirst().toFile())) {
			List<String> names = new ArrayList<>();
			zip.stream().forEach(entry -> names.add(entry.getName()));
			assertThat(names).containsExactlyInAnyOrder("PG_VERSION", "base/1/1259");
		}
	}

	@Test
	void backsUpAgainOnlyAfterTheIntervalOrAnUpdate() throws Exception {
		run("1.0.0");
		run("1.0.0");
		assertThat(backup("1.0.0").backups()).hasSize(1);

		now = now.plus(Duration.ofHours(21));
		run("1.0.0");
		assertThat(backup("1.0.0").backups()).hasSize(2);

		now = now.plusSeconds(60);
		run("1.1.0");
		assertThat(backup("1.1.0").backups()).hasSize(3);
	}

	@Test
	void keepsOnlyTheNewest() throws Exception {
		for (int i = 0; i < 5; i++) {
			run("1.0.0");
			now = now.plus(Duration.ofDays(1));
		}

		assertThat(backup("1.0.0").backups()).hasSize(3);
	}

	/** Runs a backup and stamps the new file with the fake clock, as the file system would. */
	private void run(String version) throws Exception {
		List<Path> before = Files.isDirectory(backups) ? backup(version).backups() : List.of();
		backup(version).runIfDue(pgData);
		for (Path file : backup(version).backups()) {
			if (!before.contains(file)) {
				Files.setLastModifiedTime(file, FileTime.from(now));
			}
		}
	}

	private DataBackup backup(String version) {
		return new DataBackup(backups, 3, Duration.ofHours(20), version, dir.resolve("app-version"),
				Clock.fixed(now, ZoneOffset.UTC));
	}

}
