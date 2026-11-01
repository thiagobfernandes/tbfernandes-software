package com.tbfernandes.api.work.protocols;

import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.work.domain.project.ProjectCategory;
import com.tbfernandes.api.work.domain.project.ProjectColor;
import com.tbfernandes.api.work.domain.project.ProjectDetails;
import com.tbfernandes.api.work.domain.project.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectRequest(@NotBlank @Size(max = 120) String name, @Size(max = 2000) String description,
		UUID companyId, @NotNull ProjectCategory category, ProjectStatus status, ProjectColor color,
		@NotNull LocalDate startDate, LocalDate dueDate, @Size(max = 200) String nextDelivery, UUID goalId) {

	public ProjectDetails toDetails() {
		return new ProjectDetails(name, description, companyId, category, status, color, startDate, dueDate,
				nextDelivery, goalId);
	}

}
