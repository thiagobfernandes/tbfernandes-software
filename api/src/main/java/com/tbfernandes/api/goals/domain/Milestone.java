package com.tbfernandes.api.goals.domain;

import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** A checkpoint of a goal (RF-GOL-03). Owned through its goal. */
public final class Milestone extends Aggregate<Milestone.Details> {

	private Milestone(UUID id, UUID ownerId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static Milestone create(UUID ownerId, Details details) {
		return new Milestone(Ids.forNewAggregate(), ownerId, details, true);
	}

	public static Milestone restore(UUID id, UUID ownerId, Details details) {
		return new Milestone(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		return new Details(Require.present(d.goalId(), "goalId"), Require.text(d.title(), "title", 200), d.dueDate(),
				d.done());
	}

	public record Details(UUID goalId, String title, LocalDate dueDate, boolean done) {
	}

}
