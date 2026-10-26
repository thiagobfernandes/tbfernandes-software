package com.tbfernandes.api.identity.application;

import java.util.UUID;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * tbf.auth.*
 * <ul>
 * <li>mode: {@code single-user} (no login, every request acts as tbf.owner.id; local
 * development) or {@code session} (login required, cookie session; any shared environment).</li>
 * <li>bootstrap: account created or given a password at startup when both email and password
 * are set (TBF_AUTH_BOOTSTRAP_EMAIL / TBF_AUTH_BOOTSTRAP_PASSWORD).</li>
 * </ul>
 */
@ConfigurationProperties("tbf.auth")
public record AuthProperties(Mode mode, UUID ownerId, Bootstrap bootstrap) {

	public AuthProperties {
		mode = mode == null ? Mode.SINGLE_USER : mode;
		bootstrap = bootstrap == null ? new Bootstrap(null, null, null) : bootstrap;
	}

	public boolean sessionMode() {
		return mode == Mode.SESSION;
	}

	public enum Mode {
		SINGLE_USER, SESSION
	}

	public record Bootstrap(String email, String password, String name) {

		public boolean configured() {
			return email != null && !email.isBlank() && password != null && !password.isBlank();
		}

	}

}
