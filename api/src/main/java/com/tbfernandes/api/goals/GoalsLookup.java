package com.tbfernandes.api.goals;

import java.util.List;
import java.util.UUID;

/** Read access to goals and their progress for other modules (assistant). */
public interface GoalsLookup {

	List<GoalView> goals(UUID ownerId);

	/**
	 * A goal with its progress. {@code basis} says what the percent was measured on: the
	 * indicator label, milestones or linked tasks (same rule as the frontend's goalProgress).
	 */
	record GoalView(UUID id, String name, String status, UUID parentId, int percent, String basis) {
	}

}
