package com.tbfernandes.api.work.domain.task;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * The editable fields of a task. checklistDone/checklistTotal are the aggregate progress for
 * tasks without itemized checklists; goalId points to the goals module (no FK).
 */
public record TaskDetails(String title, String description, UUID projectId, TaskPriority priority, String tag,
		LocalDate startDate, LocalDate dueDate, String doneCriteria, Integer checklistDone, Integer checklistTotal,
		List<ChecklistItem> checklistItems, UUID goalId) {

	public TaskDetails {
		checklistItems = checklistItems == null ? List.of() : List.copyOf(checklistItems);
	}

}
