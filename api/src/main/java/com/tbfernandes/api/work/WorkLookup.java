package com.tbfernandes.api.work;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Read access to work items for other modules (WRK-08). They use this instead of the
 * work tables, so the work module keeps its internals private.
 */
public interface WorkLookup {

	boolean companyExists(UUID ownerId, UUID companyId);

	boolean projectExists(UUID ownerId, UUID projectId);

	boolean taskExists(UUID ownerId, UUID taskId);

	List<ProjectView> projects(UUID ownerId);

	List<TaskView> tasks(UUID ownerId);

	/** Lightweight copy of a project, safe to hold outside the module. */
	record ProjectView(UUID id, String name, String status, UUID companyId, UUID goalId, LocalDate dueDate,
			String nextDelivery) {
	}

	/** Lightweight copy of a task, safe to hold outside the module. */
	record TaskView(UUID id, String title, String status, String priority, UUID projectId, UUID goalId,
			LocalDate dueDate) {

		public boolean open() {
			return !"done".equals(status) && !"canceled".equals(status);
		}

	}

}
