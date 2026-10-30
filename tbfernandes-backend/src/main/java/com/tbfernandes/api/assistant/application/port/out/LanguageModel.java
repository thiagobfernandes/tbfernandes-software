package com.tbfernandes.api.assistant.application.port.out;

import java.time.LocalDate;
import java.util.Optional;

import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.StructuredQuery;

/**
 * Output port for the AI provider (AST-02, AST-03). The model never sees the database: it turns
 * the question into a query that the application validates and runs, and then rewrites the text
 * of the answer. The references stay the ones the application found, so every link points to a
 * real record. Empty means no model is configured or it could not help.
 */
public interface LanguageModel {

	/** The question as a query, or empty when a lookup cannot answer it. */
	Optional<StructuredQuery> toQuery(String question, LocalDate today);

	/** The grounded answer's text rewritten for the question. */
	Optional<String> answer(String question, Answer grounded);

}
