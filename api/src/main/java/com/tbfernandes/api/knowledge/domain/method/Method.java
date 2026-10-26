package com.tbfernandes.api.knowledge.domain.method;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.Tags;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** A working method: ordered steps plus verbatim examples (RF-KNW-06). */
public final class Method {

	private final UUID id;
	private final UUID ownerId;
	private MethodDetails details;

	private Method(UUID id, UUID ownerId, MethodDetails details) {
		this.id = id;
		this.ownerId = ownerId;
		this.details = details;
	}

	public static Method create(UUID ownerId, MethodDetails details) {
		return new Method(Ids.newId(), Require.present(ownerId, "ownerId"), validated(details));
	}

	public static Method restore(UUID id, UUID ownerId, MethodDetails details) {
		return new Method(id, ownerId, details);
	}

	public void update(MethodDetails details) {
		this.details = validated(details);
	}

	private static MethodDetails validated(MethodDetails d) {
		List<Step> steps = d.steps() == null ? List.of()
				: d.steps()
					.stream()
					.map(s -> new Step(Require.text(s.title(), "step title", 200),
							Require.optionalText(s.detail(), "step detail", 2000)))
					.toList();
		if (steps.isEmpty()) {
			throw new IllegalArgumentException("a method needs at least one step");
		}
		List<Example> examples = d.examples() == null ? List.of()
				: d.examples()
					.stream()
					.map(e -> new Example(Require.text(e.title(), "example title", 200),
							Require.present(e.content(), "example content")))
					.toList();
		return new MethodDetails(Require.text(d.title(), "title", 200), Require.text(d.summary(), "summary", 1000),
				Require.present(d.category(), "category"), steps, examples, Tags.normalize(d.tags()),
				Require.present(d.lastReviewed(), "lastReviewed"));
	}

	public UUID id() {
		return id;
	}

	public UUID ownerId() {
		return ownerId;
	}

	public MethodDetails details() {
		return details;
	}

	public record Step(String title, String detail) {
	}

	public record Example(String title, String content) {
	}

	public record MethodDetails(String title, String summary, MethodCategory category, List<Step> steps,
			List<Example> examples, List<String> tags, LocalDate lastReviewed) {
	}

}
