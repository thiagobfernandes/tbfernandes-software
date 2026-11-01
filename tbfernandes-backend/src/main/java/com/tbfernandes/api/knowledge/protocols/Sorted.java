package com.tbfernandes.api.knowledge.protocols;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/** Stable order for id lists in responses, so equal data gives equal JSON. */
final class Sorted {

	private Sorted() {
	}

	static List<UUID> ids(Collection<UUID> ids) {
		return ids.stream().sorted().toList();
	}

}
