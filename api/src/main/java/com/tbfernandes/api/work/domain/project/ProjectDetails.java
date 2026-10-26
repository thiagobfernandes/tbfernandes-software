package com.tbfernandes.api.work.domain.project;

import java.time.LocalDate;
import java.util.UUID;

/** The editable fields of a project, as one value. goalId points to the goals module (no FK). */
public record ProjectDetails(String name, String description, UUID companyId, ProjectCategory category,
		ProjectStatus status, ProjectColor color, LocalDate startDate, LocalDate dueDate, String nextDelivery,
		UUID goalId) {
}
