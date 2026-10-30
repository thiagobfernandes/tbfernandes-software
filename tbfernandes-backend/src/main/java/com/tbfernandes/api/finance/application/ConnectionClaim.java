package com.tbfernandes.api.finance.application;

import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.finance.domain.EntryScope;

/**
 * Who a connection being created belongs to, sent to the provider as its clientUserId and returned
 * in webhooks. The widget's callback is not guaranteed to run, and the webhook can arrive first, so
 * the webhook alone must be able to register the connection with the scope the user chose.
 */
record ConnectionClaim(UUID ownerId, EntryScope scope) {

	private static final String SEPARATOR = ":";

	String encode() {
		return ownerId + SEPARATOR + scope;
	}

	static Optional<ConnectionClaim> parse(String clientUserId) {
		if (clientUserId == null) {
			return Optional.empty();
		}
		String[] parts = clientUserId.split(SEPARATOR);
		try {
			return parts.length == 2 ? Optional.of(new ConnectionClaim(UUID.fromString(parts[0]), EntryScope.valueOf(parts[1])))
					: Optional.empty();
		}
		catch (IllegalArgumentException ex) {
			return Optional.empty();
		}
	}

}
