package com.tbfernandes.api.assistant.domain;

import java.util.List;

/**
 * An answer in Markdown and the records it was built from (RF-AST-01). {@code source} says who
 * wrote the text: "rules" for the rule-based assistant, "query" for a {@link StructuredQuery} run
 * over the data, or "model" when a language model rewrote it. {@code query} is the query used,
 * or null when the rules answered.
 */
public record Answer(String text, List<Reference> references, String source, StructuredQuery query) {

	public Answer {
		references = List.copyOf(references);
	}

	public Answer(String text, List<Reference> references, String source) {
		this(text, references, source, null);
	}

	public Answer withText(String text, String source) {
		return new Answer(text, references, source, query);
	}

	/** A link to a record on a frontend screen. */
	public record Reference(String kind, String label, String href) {
	}

}
