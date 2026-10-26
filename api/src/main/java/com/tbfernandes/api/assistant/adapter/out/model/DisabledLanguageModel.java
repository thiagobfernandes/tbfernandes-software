package com.tbfernandes.api.assistant.adapter.out.model;

import java.util.Optional;

import com.tbfernandes.api.assistant.application.port.out.LanguageModel;
import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.Workspace;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Default adapter (ADR-005): no AI provider, so the rule-based answer is returned as is. */
@Component
@ConditionalOnProperty(prefix = "tbf.assistant.model", name = "provider", havingValue = "none", matchIfMissing = true)
class DisabledLanguageModel implements LanguageModel {

	@Override
	public Optional<String> answer(String question, Answer grounded, Workspace workspace) {
		return Optional.empty();
	}

}
