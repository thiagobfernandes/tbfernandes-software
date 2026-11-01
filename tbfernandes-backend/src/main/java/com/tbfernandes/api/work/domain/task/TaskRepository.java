package com.tbfernandes.api.work.domain.task;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Implemented in the module's infrastructure.persistence package. */
public interface TaskRepository {

	Task save(Task task);

	Optional<Task> findById(UUID ownerId, UUID id);

	List<Task> findAll(UUID ownerId, TaskFilter filter);

	void delete(Task task);

	/** Detaches the tasks of a deleted project (they stay, without project). */
	void unlinkProject(UUID ownerId, UUID projectId);

	long countCompletedSince(UUID ownerId, Instant since);

	/**
	 * All filters are optional. overdueOn returns open tasks due before that day; dueFrom and
	 * dueTo are inclusive.
	 */
	record TaskFilter(UUID projectId, TaskStatus status, LocalDate dueFrom, LocalDate dueTo, LocalDate overdueOn) {

		public static TaskFilter all() {
			return new TaskFilter(null, null, null, null, null);
		}

	}

}
