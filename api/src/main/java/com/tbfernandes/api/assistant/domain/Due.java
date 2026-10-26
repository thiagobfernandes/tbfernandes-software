package com.tbfernandes.api.assistant.domain;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

/** Due date labels, same wording as describeDue in web/src/lib/dates.ts. */
final class Due {

	private static final DateTimeFormatter SHORT = DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH);

	private Due() {
	}

	static long daysBetween(LocalDate from, LocalDate to) {
		return ChronoUnit.DAYS.between(from, to);
	}

	/** "overdue 2d", "due today", "due tomorrow", "due in 4d" or "due oct 30" (lower case, as the answers use it). */
	static String label(LocalDate dueDate, LocalDate today) {
		long diff = daysBetween(today, dueDate);
		String label;
		if (diff < 0) {
			label = "Overdue " + -diff + "d";
		}
		else if (diff == 0) {
			label = "Due today";
		}
		else if (diff == 1) {
			label = "Due tomorrow";
		}
		else if (diff <= 7) {
			label = "Due in " + diff + "d";
		}
		else {
			label = "Due " + SHORT.format(dueDate);
		}
		return label.toLowerCase(Locale.ROOT);
	}

}
