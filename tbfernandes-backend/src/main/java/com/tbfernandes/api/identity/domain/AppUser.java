package com.tbfernandes.api.identity.domain;

import java.time.ZoneId;
import java.util.Locale;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Require;

/** The account that owns the data. Holds only a password hash, never the password. */
public final class AppUser {

	private final UUID id;
	private Profile profile;
	private String passwordHash;

	private AppUser(UUID id, Profile profile, String passwordHash) {
		this.id = Require.present(id, "id");
		this.profile = profile;
		this.passwordHash = passwordHash;
	}

	public static AppUser create(UUID id, Profile profile) {
		return new AppUser(id, validated(profile), null);
	}

	public static AppUser restore(UUID id, Profile profile, String passwordHash) {
		return new AppUser(id, profile, passwordHash);
	}

	/** IDN-03. */
	public void updateProfile(Profile profile) {
		this.profile = validated(profile);
	}

	public void changePasswordHash(String hash) {
		this.passwordHash = Require.text(hash, "passwordHash", 100);
	}

	public boolean canLogIn() {
		return passwordHash != null;
	}

	private static Profile validated(Profile p) {
		String email = Require.text(p.email(), "email", 254).toLowerCase(Locale.ROOT);
		if (!email.matches("[^@\\s]+@[^@\\s]+")) {
			throw new IllegalArgumentException("email is not valid");
		}
		String zone = p.timeZone() == null ? "America/Sao_Paulo" : p.timeZone();
		try {
			ZoneId.of(zone);
		}
		catch (RuntimeException ex) {
			throw new IllegalArgumentException("timeZone is not a valid zone id");
		}
		return new Profile(Require.text(p.name(), "name", 120), email, p.locale() == null ? "pt-BR" : p.locale(),
				zone);
	}

	public UUID id() {
		return id;
	}

	public Profile profile() {
		return profile;
	}

	public String passwordHash() {
		return passwordHash;
	}

	public record Profile(String name, String email, String locale, String timeZone) {
	}

}
