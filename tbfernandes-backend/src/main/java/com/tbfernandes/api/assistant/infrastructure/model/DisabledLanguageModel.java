package com.tbfernandes.api.assistant.infrastructure.model;

import java.time.LocalDate;
import java.util.Optional;

import com.tbfernandes.api.assistant.application.LanguageModel;
import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.StructuredQuery;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Default implementation (ADR-005): no AI provider, so the rule-based answer is returned as is. */
@Component
@ConditionalOnProperty(prefix = "tbf.assistant.model", name = "provider", havingValue = "none", matchIfMissing = true)
class DisabledLanguageModel implements LanguageModel {

	@Override
	public Optional<StructuredQuery> toQuery(String question, LocalDate today) {
		return Optional.empty();
	}

	@Override
	public Optional<String> answer(String question, Answer grounded) {
		return Optional.empty();
	}

}
