package com.tbfernandes.api.assistant.domain;

import java.util.List;

/**
 * An answer in Markdown and the records it was built from (RF-AST-01). {@code source} is
 * "rules" for the rule-based assistant or "model" when a language model wrote the text.
 */
public record Answer(String text, List<Reference> references, String source) {

	public Answer {
		references = List.copyOf(references);
	}

	public Answer withText(String text, String source) {
		return new Answer(text, references, source);
	}

	/** A link to a record on a frontend screen. */
	public record Reference(String kind, String label, String href) {
	}

}
