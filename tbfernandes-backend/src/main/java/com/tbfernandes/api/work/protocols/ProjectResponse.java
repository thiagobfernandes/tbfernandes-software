package com.tbfernandes.api.work.protocols;

import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.work.domain.project.Project;
import com.tbfernandes.api.work.domain.project.ProjectCategory;
import com.tbfernandes.api.work.domain.project.ProjectColor;
import com.tbfernandes.api.work.domain.project.ProjectDetails;
import com.tbfernandes.api.work.domain.project.ProjectStatus;

public record ProjectResponse(UUID id, String name, String description, UUID companyId, ProjectCategory category,
		ProjectStatus status, ProjectColor color, LocalDate startDate, LocalDate dueDate, String nextDelivery,
		UUID goalId) {

	public static ProjectResponse from(Project project) {
		ProjectDetails d = project.details();
		return new ProjectResponse(project.id(), d.name(), d.description(), d.companyId(), d.category(),
				d.status(), d.color(), d.startDate(), d.dueDate(), d.nextDelivery(), d.goalId());
	}

}
