package com.tbfernandes.api.work.domain.task;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port: implemented by the persistence adapter. */
public interface TaskRepository {

	Task save(Task task);

	Optional<Task> findById(UUID ownerId, UUID id);

	List<Task> findAll(UUID ownerId, TaskFilter filter);

	void delete(Task task);

	record TaskFilter(UUID projectId, TaskStatus status) {
	}

}
