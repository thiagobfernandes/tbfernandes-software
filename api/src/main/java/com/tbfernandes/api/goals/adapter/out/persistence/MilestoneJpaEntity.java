package com.tbfernandes.api.goals.adapter.out.persistence;

import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(schema = "goals", name = "milestone")
class MilestoneJpaEntity extends AuditedEntity {

	UUID goalId;

	String title;

	LocalDate dueDate;

	boolean done;

}
