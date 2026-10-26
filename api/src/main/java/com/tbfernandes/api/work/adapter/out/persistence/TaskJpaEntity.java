package com.tbfernandes.api.work.adapter.out.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.domain.task.TaskPriority;
import com.tbfernandes.api.work.domain.task.TaskStatus;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

@Entity
@Table(schema = "work", name = "task")
class TaskJpaEntity extends AuditedEntity {

	String title;

	String description;

	UUID projectId;

	@Enumerated(EnumType.STRING)
	TaskStatus status;

	@Enumerated(EnumType.STRING)
	TaskPriority priority;

	String tag;

	LocalDate startDate;

	LocalDate dueDate;

	String doneCriteria;

	Integer checklistDone;

	Integer checklistTotal;

	UUID goalId;

	Instant completedAt;

	@ElementCollection
	@CollectionTable(schema = "work", name = "task_checklist_item", joinColumns = @JoinColumn(name = "task_id"))
	@OrderColumn(name = "position")
	List<ChecklistItemEmbeddable> checklistItems = new ArrayList<>();

	@Embeddable
	record ChecklistItemEmbeddable(UUID id, String title, boolean done) {
	}

}
