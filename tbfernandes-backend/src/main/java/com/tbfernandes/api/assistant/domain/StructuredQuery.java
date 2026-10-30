package com.tbfernandes.api.assistant.domain;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;

/**
 * A question turned into filters over the owner's data (AST-03). It only describes what to read:
 * {@link QueryEngine} runs it over a {@link Workspace}, so nothing a language model returns can
 * reach the database or write anything (RN-20). Empty filters do not filter.
 */
public record StructuredQuery(Subject subject, Aggregate aggregate, String text, List<String> statuses,
		List<String> priorities, boolean openOnly, String project, String company, LocalDate dueFrom, LocalDate dueTo,
		YearMonth month, Sort sort, int limit) {

	public static final int DEFAULT_LIMIT = 20;

	public static final int MAX_LIMIT = 50;

	public enum Subject {

		TASKS, PROJECTS, COMPANIES, NOTES, SNIPPETS, GOALS, STUDIES, PURCHASES, CONTACTS, CASH_FLOW

	}

	public enum Aggregate {

		LIST, COUNT

	}

	public enum Sort {

		DUE_DATE, PRIORITY, NAME

	}

	public StructuredQuery {
		if (subject == null) {
			throw new IllegalArgumentException("A query needs a subject");
		}
		aggregate = aggregate == null ? Aggregate.LIST : aggregate;
		text = clean(text);
		statuses = lowerCase(statuses);
		priorities = lowerCase(priorities);
		project = clean(project);
		company = clean(company);
		sort = sort == null ? Sort.DUE_DATE : sort;
		limit = limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);
	}

	private static String clean(String value) {
		return value == null ? "" : value.strip();
	}

	private static List<String> lowerCase(List<String> values) {
		return values == null ? List.of() : values.stream().map(v -> v.strip().toLowerCase(Locale.ROOT)).toList();
	}

}
