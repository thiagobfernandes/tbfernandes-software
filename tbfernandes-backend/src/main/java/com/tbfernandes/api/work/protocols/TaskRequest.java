package com.tbfernandes.api.work.protocols;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.domain.task.ChecklistItem;
import com.tbfernandes.api.work.domain.task.TaskDetails;
import com.tbfernandes.api.work.domain.task.TaskPriority;
import com.tbfernandes.api.work.domain.task.TaskStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TaskRequest(@NotBlank @Size(max = 200) String title, @Size(max = 5000) String description,
		UUID projectId, TaskStatus status, TaskPriority priority, @Size(max = 40) String tag,
		LocalDate startDate, LocalDate dueDate, @Size(max = 1000) String doneCriteria, @Valid Progress checklist,
		List<@Valid ChecklistItemDto> checklistItems, UUID goalId) {

	public TaskDetails toDetails() {
		List<ChecklistItem> items = checklistItems == null ? List.of()
				: checklistItems.stream().map(i -> new ChecklistItem(i.id(), i.title(), i.done())).toList();
		return new TaskDetails(title, description, projectId, priority, tag, startDate, dueDate, doneCriteria,
				checklist == null ? null : checklist.done(), checklist == null ? null : checklist.total(), items,
				goalId);
	}

}
