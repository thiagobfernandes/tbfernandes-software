package com.tbfernandes.api.learning.domain;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** A study plan (RF-LRN-01). goalId points to the goals module (no FK). */
public final class Study extends Aggregate<Study.Details> {

	private Study(UUID id, UUID ownerId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static Study create(UUID ownerId, Details details) {
		return new Study(Ids.newId(), ownerId, details, true);
	}

	public static Study restore(UUID id, UUID ownerId, Details details) {
		return new Study(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		Require.dateOrder(d.startDate(), d.dueDate(), "dueDate");
		return new Details(Require.text(d.name(), "name", 200), Require.optionalText(d.description(), "description", 2000),
				d.status() == null ? StudyStatus.PLANNED : d.status(), d.goalId(),
				d.skillIds() == null ? Set.of() : Set.copyOf(d.skillIds()), d.startDate(), d.dueDate(),
				Require.optionalText(d.nextActivity(), "nextActivity", 300));
	}

	public record Details(String name, String description, StudyStatus status, UUID goalId, Set<UUID> skillIds, LocalDate startDate,
			LocalDate dueDate, String nextActivity) {
	}

}
