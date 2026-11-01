package com.tbfernandes.api.work.infrastructure.persistence;

import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.work.domain.project.ProjectCategory;
import com.tbfernandes.api.work.domain.project.ProjectColor;
import com.tbfernandes.api.work.domain.project.ProjectStatus;
import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(schema = "work", name = "project")
class ProjectJpaEntity extends AuditedEntity {

	String name;

	String description;

	UUID companyId;

	@Enumerated(EnumType.STRING)
	ProjectCategory category;

	@Enumerated(EnumType.STRING)
	ProjectStatus status;

	@Enumerated(EnumType.STRING)
	ProjectColor color;

	LocalDate startDate;

	LocalDate dueDate;

	String nextDelivery;

	UUID goalId;

}
