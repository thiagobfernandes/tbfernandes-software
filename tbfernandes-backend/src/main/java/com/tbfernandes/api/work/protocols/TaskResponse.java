package com.tbfernandes.api.work.protocols;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.domain.task.Task;
import com.tbfernandes.api.work.domain.task.TaskDetails;
import com.tbfernandes.api.work.domain.task.TaskPriority;
import com.tbfernandes.api.work.domain.task.TaskStatus;

/** Same shape as web/src/features/tasks/types/task.ts. */
public record TaskResponse(UUID id, String title, String description, UUID projectId, TaskStatus status,
		TaskPriority priority, String tag, LocalDate startDate, LocalDate dueDate, String doneCriteria,
		Progress checklist, List<ChecklistItemDto> checklistItems, UUID goalId, Instant completedAt) {

	public static TaskResponse from(Task task) {
		TaskDetails d = task.details();
		Task.Progress progress = task.progress();
		return new TaskResponse(task.id(), d.title(), d.description(), d.projectId(), task.status(),
				d.priority(), d.tag(), d.startDate(), d.dueDate(), d.doneCriteria(),
				progress == null ? null : new Progress(progress.done(), progress.total()),
				d.checklistItems().stream().map(i -> new ChecklistItemDto(i.id(), i.title(), i.done())).toList(),
				d.goalId(), task.completedAt());
	}

}
