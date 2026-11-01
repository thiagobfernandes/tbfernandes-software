package com.tbfernandes.api.knowledge.protocols;

import java.time.LocalDate;
import java.util.List;

import com.tbfernandes.api.knowledge.domain.method.Method.Example;
import com.tbfernandes.api.knowledge.domain.method.Method.MethodDetails;
import com.tbfernandes.api.knowledge.domain.method.Method.Step;
import com.tbfernandes.api.knowledge.domain.method.MethodCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MethodRequest(@NotBlank @Size(max = 200) String title, @NotBlank @Size(max = 1000) String summary,
		@NotNull MethodCategory category, @NotEmpty List<Step> steps, List<Example> examples, List<String> tags,
		@NotNull LocalDate lastReviewed) {

	public MethodDetails toDetails() {
		return new MethodDetails(title, summary, category, steps, examples, tags, lastReviewed);
	}

}
