package com.tbfernandes.api.assistant.application.port.out;

import java.util.Optional;

import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.Workspace;

/**
 * Output port for the AI provider (AST-02). The model only rewrites the text: it receives the
 * question, the rule-based answer and the snapshot it was built from, and the references stay
 * the ones the rules found, so every link points to a real record. The provider adapter is
 * epic AST-03; until then {@code DisabledLanguageModel} is the only one.
 */
public interface LanguageModel {

	/** The model's answer text, or empty when no model is configured or it failed. */
	Optional<String> answer(String question, Answer grounded, Workspace workspace);

}
