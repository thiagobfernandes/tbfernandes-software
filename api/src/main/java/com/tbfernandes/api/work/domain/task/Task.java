package com.tbfernandes.api.work.domain.task;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/**
 * A unit of work. Holds the status rules: completing records when (RN-06), reopening clears it,
 * and a blocked task cannot be completed directly (RN-07).
 */
public final class Task {

	private final UUID id;
	private final UUID ownerId;
	private TaskDetails details;
	private TaskStatus status;
	private Instant completedAt;

	private Task(UUID id, UUID ownerId, TaskDetails details, TaskStatus status, Instant completedAt) {
		this.id = id;
		this.ownerId = ownerId;
		this.details = details;
		this.status = status;
		this.completedAt = completedAt;
	}

	public static Task create(UUID ownerId, TaskDetails details, TaskStatus status, Clock clock) {
		Task task = new Task(Ids.forNewAggregate(), Require.present(ownerId, "ownerId"), validated(details), TaskStatus.BACKLOG,
				null);
		task.changeStatus(status == null ? TaskStatus.BACKLOG : status, clock);
		return task;
	}

	public static Task restore(UUID id, UUID ownerId, TaskDetails details, TaskStatus status, Instant completedAt) {
		return new Task(id, ownerId, details, status, completedAt);
	}

	public void update(TaskDetails details) {
		this.details = validated(details);
	}

	/**
	 * Moves the task and returns true when this call completed it, so the caller can publish
	 * {@code TaskCompleted}.
	 */
	public boolean changeStatus(TaskStatus next, Clock clock) {
		Require.present(next, "status");
		if (next == status) {
			return false;
		}
		if (status == TaskStatus.BLOCKED && next == TaskStatus.DONE) {
			throw new BusinessRuleViolation("RN-07", "Unblock the task before completing it");
		}
		this.status = next;
		if (next == TaskStatus.DONE) {
			this.completedAt = clock.instant();
			return true;
		}
		this.completedAt = null;
		return false;
	}

	private static TaskDetails validated(TaskDetails d) {
		Require.dateOrder(d.startDate(), d.dueDate(), "dueDate");
		Integer done = d.checklistDone();
		Integer total = d.checklistTotal();
		if ((done == null) != (total == null) || (total != null && (done < 0 || total < done))) {
			throw new BusinessRuleViolation("RN-08", "Checklist progress needs 0 <= done <= total");
		}
		return new TaskDetails(Require.text(d.title(), "title", 200),
				Require.optionalText(d.description(), "description", 5000), d.projectId(),
				d.priority() == null ? TaskPriority.NORMAL : d.priority(), Require.optionalText(d.tag(), "tag", 40),
				d.startDate(), d.dueDate(), Require.optionalText(d.doneCriteria(), "doneCriteria", 1000), done, total,
				d.checklistItems(), d.goalId());
	}

	/** Progress from itemized items when present, else the aggregate (same as the frontend). */
	public Progress progress() {
		if (!details.checklistItems().isEmpty()) {
			int doneItems = (int) details.checklistItems().stream().filter(ChecklistItem::done).count();
			return new Progress(doneItems, details.checklistItems().size());
		}
		return details.checklistTotal() == null ? null : new Progress(details.checklistDone(), details.checklistTotal());
	}

	public UUID id() {
		return id;
	}

	public UUID ownerId() {
		return ownerId;
	}

	public TaskDetails details() {
		return details;
	}

	public TaskStatus status() {
		return status;
	}

	public Instant completedAt() {
		return completedAt;
	}

	public record Progress(int done, int total) {
	}

}
