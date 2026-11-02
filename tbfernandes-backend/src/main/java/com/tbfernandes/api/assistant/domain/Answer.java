package com.tbfernandes.api.assistant.domain;

import java.util.List;

/**
 * An answer in Markdown and the records it was built from (RF-AST-01). {@code source} says who
 * wrote the text: "rules" for the rule-based assistant, "query" for a {@link StructuredQuery} run
 * over the data, or "model" when a language model rewrote it. {@code query} is the query used,
 * or null when the rules answered. AST-04 adds "rag" (the model answered from passages of notes
 * and snippets) and "search" (the passages themselves, when no model is configured).
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

	/**
	 * A link to a record on a frontend screen. {@code excerpt} is the passage of the record the
	 * answer used, or null when the answer does not come from a passage.
	 */
	public record Reference(String kind, String label, String href, String excerpt) {

		public Reference(String kind, String label, String href) {
			this(kind, label, href, null);
		}

	}

}
