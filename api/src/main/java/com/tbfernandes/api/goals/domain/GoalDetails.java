package com.tbfernandes.api.goals.domain;

import java.time.LocalDate;
import java.util.UUID;

public record GoalDetails(String name, String description, GoalArea area, GoalStatus status, GoalPriority priority,
		String currentState, String desiredResult, String doneCriteria, LocalDate dueDate, Indicator indicator,
		UUID parentId) {
}
