package com.tbfernandes.api.assistant.infrastructure.model;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.tbfernandes.api.assistant.domain.StructuredQuery;
import com.tbfernandes.api.assistant.domain.StructuredQuery.Aggregate;
import com.tbfernandes.api.assistant.domain.StructuredQuery.Sort;
import com.tbfernandes.api.assistant.domain.StructuredQuery.Subject;

/**
 * The JSON the model has to return for a question. The output schema is derived from this record.
 * Every field is required and an empty value means "no filter", so the schema stays simple.
 */
record QueryPlan(
		@JsonPropertyDescription("False when no lookup answers the question: a greeting, advice, or what to focus on today") boolean answerable,
		@JsonPropertyDescription("The kind of record the question is about. CASH_FLOW is the income and expense totals of a month") Subject subject,
		@JsonPropertyDescription("COUNT for 'how many' questions, otherwise LIST") Aggregate aggregate,
		@JsonPropertyDescription("Keywords to find in names and text, empty for none") String text,
		@JsonPropertyDescription("""
				Statuses to keep, empty for all. Tasks: backlog, todo, in_progress, blocked, done, canceled. \
				Projects and goals: planned, active, paused, completed. Studies: planned, in_progress, paused, completed. \
				Purchases: planned, saving, bought. Companies: active, inactive, closed""") List<String> statuses,
		@JsonPropertyDescription("Task priorities to keep, empty for all: urgent, high, normal, low") List<String> priorities,
		@JsonPropertyDescription("True to leave out finished or canceled records, as in 'overdue' or 'pending'") boolean openOnly,
		@JsonPropertyDescription("Project name, empty for none") String project,
		@JsonPropertyDescription("Company name, empty for none") String company,
		@JsonPropertyDescription("First due date to keep as YYYY-MM-DD, empty for none") String dueFrom,
		@JsonPropertyDescription("Last due date to keep as YYYY-MM-DD, empty for none. For overdue records, yesterday") String dueTo,
		@JsonPropertyDescription("Month for CASH_FLOW as YYYY-MM, empty for the current month") String month,
		@JsonPropertyDescription("DUE_DATE unless the question asks for another order") Sort sort,
		@JsonPropertyDescription("How many records to show, from 1 to 50. 20 unless the question says otherwise") int limit) {

	StructuredQuery toQuery() {
		return new StructuredQuery(subject, aggregate, text, statuses, priorities, openOnly, project, company, date(dueFrom),
				date(dueTo), month == null || month.isBlank() ? null : YearMonth.parse(month.strip()), sort, limit);
	}

	private static LocalDate date(String value) {
		return value == null || value.isBlank() ? null : LocalDate.parse(value.strip());
	}

}
