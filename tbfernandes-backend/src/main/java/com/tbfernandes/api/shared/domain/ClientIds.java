package com.tbfernandes.api.shared.domain;

import java.util.UUID;

/**
 * Id the client chose for the record a request creates (ADR-007). The web layer sets it from
 * the {@code X-Client-Id} header; {@link Ids#forNewAggregate()} hands it to the first aggregate
 * created in the request. Lets the frontend create records optimistically with a stable id.
 * <p>
 * Thread-bound because a request runs on one thread; listeners that run after commit run on
 * other threads and never see it.
 */
public final class ClientIds {

	private static final ThreadLocal<UUID> REQUESTED = new ThreadLocal<>();

	private static final ThreadLocal<UUID> ASSIGNED = new ThreadLocal<>();

	private ClientIds() {
	}

	public static void request(UUID id) {
		REQUESTED.set(id);
		ASSIGNED.remove();
	}

	public static void clear() {
		REQUESTED.remove();
		ASSIGNED.remove();
	}

	/** True if {@code id} was given by the client for a record created in this request. */
	public static boolean assignedInThisRequest(UUID id) {
		return id != null && id.equals(ASSIGNED.get());
	}

	static UUID take() {
		UUID id = REQUESTED.get();
		if (id != null) {
			REQUESTED.remove();
			ASSIGNED.set(id);
		}
		return id;
	}

}
