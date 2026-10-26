package com.tbfernandes.api.knowledge.domain;

import java.util.Collection;
import java.util.List;
import java.util.Locale;

/** Tags are trimmed, lower case, unique and kept in the order given. */
public final class Tags {

	private Tags() {
	}

	public static List<String> normalize(Collection<String> tags) {
		if (tags == null) {
			return List.of();
		}
		List<String> clean = tags.stream()
			.filter(tag -> tag != null && !tag.isBlank())
			.map(tag -> tag.strip().toLowerCase(Locale.ROOT))
			.distinct()
			.toList();
		if (clean.stream().anyMatch(tag -> tag.length() > 40)) {
			throw new IllegalArgumentException("tags must have at most 40 characters");
		}
		return clean;
	}

}
