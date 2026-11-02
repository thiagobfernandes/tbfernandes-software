package com.tbfernandes.api.knowledge.protocols;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.method.Method;
import com.tbfernandes.api.knowledge.domain.method.Method.Example;
import com.tbfernandes.api.knowledge.domain.method.Method.MethodDetails;
import com.tbfernandes.api.knowledge.domain.method.Method.Step;
import com.tbfernandes.api.knowledge.domain.method.MethodCategory;

/** Same shape as Method in web/src/features/methods/types/method.ts. */
public record MethodResponse(UUID id, String title, String summary, MethodCategory category, List<Step> steps,
		List<Example> examples, List<String> tags, LocalDate lastReviewed) {

	public static MethodResponse from(Method method) {
		MethodDetails d = method.details();
		return new MethodResponse(method.id(), d.title(), d.summary(), d.category(), d.steps(), d.examples(),
				d.tags(), d.lastReviewed());
	}

}
