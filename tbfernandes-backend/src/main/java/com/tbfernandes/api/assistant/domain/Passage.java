package com.tbfernandes.api.assistant.domain;

/** A passage found for a question, with its relevance from 0 to 1 (AST-04). */
public record Passage(KnowledgeDocument.Key source, String title, String text, double score) {

	public String href() {
		return source.kind().href(source.id());
	}

}
