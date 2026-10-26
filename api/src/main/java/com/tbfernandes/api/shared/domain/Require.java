package com.tbfernandes.api.shared.domain;

import java.time.LocalDate;

/** Guards for domain invariants, so entities stay free of framework validation. */
public final class Require {

	private Require() {
	}

	public static String text(String value, String field, int maxLength) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException(field + " is required");
		}
		String trimmed = value.strip();
		if (trimmed.length() > maxLength) {
			throw new IllegalArgumentException(field + " must have at most " + maxLength + " characters");
		}
		return trimmed;
	}

	public static String optionalText(String value, String field, int maxLength) {
		return value == null || value.isBlank() ? null : text(value, field, maxLength);
	}

	public static <T> T present(T value, String field) {
		if (value == null) {
			throw new IllegalArgumentException(field + " is required");
		}
		return value;
	}

	/** RN-02: an end date never comes before its start date. */
	public static void dateOrder(LocalDate start, LocalDate end, String endField) {
		if (start != null && end != null && end.isBefore(start)) {
			throw new BusinessRuleViolation("RN-02", endField + " must not be before the start date");
		}
	}

}
