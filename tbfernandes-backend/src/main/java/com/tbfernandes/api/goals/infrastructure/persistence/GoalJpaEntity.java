package com.tbfernandes.api.goals.infrastructure.persistence;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.goals.domain.GoalArea;
import com.tbfernandes.api.goals.domain.GoalPriority;
import com.tbfernandes.api.goals.domain.GoalStatus;
import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(schema = "goals", name = "goal")
class GoalJpaEntity extends AuditedEntity {

	UUID parentId;

	String name;

	String description;

	@Enumerated(EnumType.STRING)
	GoalArea area;

	@Enumerated(EnumType.STRING)
	GoalStatus status;

	@Enumerated(EnumType.STRING)
	GoalPriority priority;

	String currentState;

	String desiredResult;

	String doneCriteria;

	LocalDate dueDate;

	String indicatorLabel;

	BigDecimal indicatorCurrent;

	BigDecimal indicatorTarget;

	String indicatorUnit;

}
