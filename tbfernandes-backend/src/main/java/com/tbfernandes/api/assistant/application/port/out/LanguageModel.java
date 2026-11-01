package com.tbfernandes.api.assistant.application.port.out;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.Passage;
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

	/**
	 * An answer written only from the passages of notes and snippets (AST-04), citing them as [n],
	 * where n is the passage's position from 1.
	 */
	Optional<String> answerFromPassages(String question, List<Passage> passages);

}
