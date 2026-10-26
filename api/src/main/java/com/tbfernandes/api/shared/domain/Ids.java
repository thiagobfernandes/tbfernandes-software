package com.tbfernandes.api.shared.domain;

import java.security.SecureRandom;
import java.time.Clock;
import java.util.UUID;

/**
 * Time-ordered UUIDs (version 7, RFC 9562): unique like random UUIDs, but
 * inserted in order, which keeps primary-key indexes compact.
 */
public final class Ids {

	private static final SecureRandom RANDOM = new SecureRandom();

	private Ids() {
	}

	public static UUID newId() {
		return newId(Clock.systemUTC());
	}

	static UUID newId(Clock clock) {
		long millis = clock.millis();
		long msb = (millis << 16) | 0x7000L | (RANDOM.nextInt() & 0x0FFFL);
		long lsb = (RANDOM.nextLong() & 0x3FFFFFFFFFFFFFFFL) | 0x8000000000000000L;
		return new UUID(msb, lsb);
	}

}
