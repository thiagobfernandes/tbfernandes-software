package com.tbfernandes.api.work;

import java.time.LocalDate;
import java.util.UUID;

/** Lets other modules create a task (e.g. a contact follow-up, CTC-03) through the work rules. */
public interface FollowUpTasks {

	/** Creates a "todo" task without project and returns its id. */
	UUID create(String title, String description, LocalDate dueDate);

}
