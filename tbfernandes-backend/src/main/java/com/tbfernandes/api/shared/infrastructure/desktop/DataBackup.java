package com.tbfernandes.api.shared.infrastructure.desktop;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Backups of the desktop app's database: a zip of the PostgreSQL data directory, taken while
 * the server is stopped (so the copy is consistent), before it starts.
 * <ul>
 * <li>When: once the last backup is older than {@code interval}, or when the app version
 * changed (an update may run new migrations).</li>
 * <li>Where: {@code backupDir} (Documents\TBFernandes\backups in the app), keeping the newest
 * {@code keep} files.</li>
 * <li>Restore: close the app, replace {@code <data dir>/pg} with the zip's contents.</li>
 * </ul>
 * The binaries shipped with the app have no pg_dump, hence a file-level copy.
 */
public final class DataBackup {

	private static final Logger log = LoggerFactory.getLogger(DataBackup.class);

	private static final String PREFIX = "tbfernandes-";

	private static final DateTimeFormatter NAME = DateTimeFormatter.ofPattern("yyyy-MM-dd-HHmmss");

	/** Written by a running server; meaningless in a copy. */
	private static final Set<String> SKIPPED = Set.of("postmaster.pid", "postmaster.opts");

	private final Path backupDir;

	private final int keep;

	private final Duration interval;

	private final String appVersion;

	private final Path versionFile;

	private final Clock clock;

	public DataBackup(Path backupDir, int keep, Duration interval, String appVersion, Path versionFile, Clock clock) {
		this.backupDir = backupDir;
		this.keep = Math.max(1, keep);
		this.interval = interval;
		this.appVersion = appVersion == null ? "" : appVersion;
		this.versionFile = versionFile;
		this.clock = clock;
	}

	/** Backs up {@code pgData} if one is due. A failed backup is logged and never blocks the app. */
	public void runIfDue(Path pgData) {
		try {
			String reason = dueReason();
			if (reason != null) {
				Path file = write(pgData);
				log.info("Backup {} ({})", file, reason);
				prune();
			}
			Files.writeString(versionFile, appVersion, StandardCharsets.UTF_8);
		}
		catch (IOException | UncheckedIOException ex) {
			log.warn("Backup failed; the app starts anyway", ex);
		}
	}

	String dueReason() throws IOException {
		String lastVersion = Files.exists(versionFile) ? Files.readString(versionFile, StandardCharsets.UTF_8).strip()
				: null;
		if (lastVersion != null && !lastVersion.equals(appVersion)) {
			return "app updated from " + lastVersion + " to " + appVersion;
		}
		Instant last = backups().stream().findFirst().map(DataBackup::modified).orElse(null);
		if (last == null) {
			return "first backup";
		}
		return Duration.between(last, clock.instant()).compareTo(interval) >= 0 ? "last one is older than " + interval
				: null;
	}

	/** Newest first. */
	List<Path> backups() throws IOException {
		if (!Files.isDirectory(backupDir)) {
			return List.of();
		}
		try (Stream<Path> files = Files.list(backupDir)) {
			return files.filter(file -> {
				String name = file.getFileName().toString();
				return name.startsWith(PREFIX) && name.endsWith(".zip");
			}).sorted(Comparator.comparing(DataBackup::modified).reversed()).toList();
		}
	}

	private Path write(Path pgData) throws IOException {
		Files.createDirectories(backupDir);
		String stamp = LocalDateTime.now(clock).format(NAME);
		Path target = backupDir.resolve(PREFIX + stamp + ".zip");
		Path partial = backupDir.resolve(PREFIX + stamp + ".zip.partial");
		try (OutputStream out = Files.newOutputStream(partial); ZipOutputStream zip = new ZipOutputStream(out);
				Stream<Path> files = Files.walk(pgData)) {
			for (Path file : (Iterable<Path>) files.filter(Files::isRegularFile)::iterator) {
				if (SKIPPED.contains(file.getFileName().toString())) {
					continue;
				}
				zip.putNextEntry(new ZipEntry(pgData.relativize(file).toString().replace('\\', '/')));
				Files.copy(file, zip);
				zip.closeEntry();
			}
		}
		catch (IOException ex) {
			Files.deleteIfExists(partial);
			throw ex;
		}
		return Files.move(partial, target, StandardCopyOption.REPLACE_EXISTING);
	}

	private void prune() throws IOException {
		List<Path> all = backups();
		for (Path old : all.subList(Math.min(keep, all.size()), all.size())) {
			Files.deleteIfExists(old);
		}
	}

	private static Instant modified(Path file) {
		try {
			return Objects.requireNonNull(Files.getLastModifiedTime(file).toInstant());
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

}
