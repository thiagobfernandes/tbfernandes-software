package com.tbfernandes.api.assistant.domain;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

/** Due date labels, same wording as describeDue in web/src/lib/dates.ts. */
final class Due {

	private static final DateTimeFormatter SHORT = DateTimeFormatter.ofPattern("d 'de' MMM", Locale.of("pt", "BR"));

	private Due() {
	}

	static long daysBetween(LocalDate from, LocalDate to) {
		return ChronoUnit.DAYS.between(from, to);
	}

	/** "atrasada 2d", "vence hoje", "vence amanhã", "vence em 4d" ou "vence 30 de out." (minúsculas, como as respostas usam). */
	static String label(LocalDate dueDate, LocalDate today) {
		long diff = daysBetween(today, dueDate);
		String label;
		if (diff < 0) {
			label = "Atrasada " + -diff + "d";
		}
		else if (diff == 0) {
			label = "Vence hoje";
		}
		else if (diff == 1) {
			label = "Vence amanhã";
		}
		else if (diff <= 7) {
			label = "Vence em " + diff + "d";
		}
		else {
			label = "Vence " + SHORT.format(dueDate);
		}
		return label.toLowerCase(Locale.of("pt", "BR"));
	}

}
