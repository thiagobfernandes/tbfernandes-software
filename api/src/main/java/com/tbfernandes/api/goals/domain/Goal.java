package com.tbfernandes.api.goals.domain;

import java.math.BigDecimal;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** A goal or sub-goal (RF-GOL-01, RF-GOL-02). */
public final class Goal extends Aggregate<GoalDetails> {

	private Goal(UUID id, UUID ownerId, GoalDetails details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static Goal create(UUID ownerId, GoalDetails details) {
		return new Goal(Ids.newId(), ownerId, details, true);
	}

	public static Goal restore(UUID id, UUID ownerId, GoalDetails details) {
		return new Goal(id, ownerId, details, false);
	}

	@Override
	protected GoalDetails validate(GoalDetails d) {
		if (id() != null && id().equals(d.parentId())) {
			throw new BusinessRuleViolation("RN-19", "A goal cannot be its own sub-goal");
		}
		return new GoalDetails(Require.text(d.name(), "name", 200),
				Require.optionalText(d.description(), "description", 2000), Require.present(d.area(), "area"),
				d.status() == null ? GoalStatus.PLANNED : d.status(),
				d.priority() == null ? GoalPriority.NORMAL : d.priority(),
				Require.optionalText(d.currentState(), "currentState", 2000),
				Require.text(d.desiredResult(), "desiredResult", 2000),
				Require.optionalText(d.doneCriteria(), "doneCriteria", 1000), d.dueDate(), d.indicator(),
				d.parentId());
	}

	/** RF-GOL-04. */
	public void recordProgress(BigDecimal current) {
		if (details().indicator() == null) {
			throw new BusinessRuleViolation("RN-21", "The goal has no indicator to update");
		}
		update(with(details().status(), details().indicator().withCurrent(current)));
	}

	/**
	 * GOL-05: a linked task was completed. A planned goal becomes active, and an indicator
	 * counted in "tasks" goes up by one. Returns true if anything changed.
	 */
	public boolean linkedTaskCompleted() {
		GoalDetails d = details();
		GoalStatus status = d.status() == GoalStatus.PLANNED ? GoalStatus.ACTIVE : d.status();
		Indicator indicator = d.indicator();
		if (indicator != null && "tasks".equalsIgnoreCase(indicator.unit())) {
			indicator = indicator.withCurrent(indicator.current().add(BigDecimal.ONE));
		}
		if (status == d.status() && indicator == d.indicator()) {
			return false;
		}
		update(with(status, indicator));
		return true;
	}

	private GoalDetails with(GoalStatus status, Indicator indicator) {
		GoalDetails d = details();
		return new GoalDetails(d.name(), d.description(), d.area(), status, d.priority(), d.currentState(),
				d.desiredResult(), d.doneCriteria(), d.dueDate(), indicator, d.parentId());
	}

}
