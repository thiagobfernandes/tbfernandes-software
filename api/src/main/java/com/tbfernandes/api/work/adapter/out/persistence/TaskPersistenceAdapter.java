package com.tbfernandes.api.work.adapter.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.work.domain.task.ChecklistItem;
import com.tbfernandes.api.work.domain.task.Task;
import com.tbfernandes.api.work.domain.task.TaskDetails;
import com.tbfernandes.api.work.domain.task.TaskRepository;
import org.springframework.stereotype.Component;

@Component
class TaskPersistenceAdapter implements TaskRepository {

	private final TaskJpaRepository tasks;

	TaskPersistenceAdapter(TaskJpaRepository tasks) {
		this.tasks = tasks;
	}

	@Override
	public Task save(Task task) {
		TaskJpaEntity entity = tasks.findById(task.id()).orElseGet(TaskJpaEntity::new);
		entity.id = task.id();
		entity.ownerId = task.ownerId();
		TaskDetails d = task.details();
		entity.title = d.title();
		entity.description = d.description();
		entity.projectId = d.projectId();
		entity.status = task.status();
		entity.priority = d.priority();
		entity.tag = d.tag();
		entity.startDate = d.startDate();
		entity.dueDate = d.dueDate();
		entity.doneCriteria = d.doneCriteria();
		entity.checklistDone = d.checklistDone();
		entity.checklistTotal = d.checklistTotal();
		entity.goalId = d.goalId();
		entity.completedAt = task.completedAt();
		entity.checklistItems.clear();
		d.checklistItems()
			.forEach(item -> entity.checklistItems
				.add(new TaskJpaEntity.ChecklistItemEmbeddable(item.id(), item.title(), item.done())));
		return toDomain(tasks.save(entity));
	}

	@Override
	public Optional<Task> findById(UUID ownerId, UUID id) {
		return tasks.findByOwnerIdAndId(ownerId, id).map(TaskPersistenceAdapter::toDomain);
	}

	@Override
	public List<Task> findAll(UUID ownerId, TaskFilter filter) {
		return tasks.search(ownerId, filter.projectId(), filter.status())
			.stream()
			.map(TaskPersistenceAdapter::toDomain)
			.toList();
	}

	@Override
	public void delete(Task task) {
		tasks.deleteById(task.id());
	}

	private static Task toDomain(TaskJpaEntity e) {
		List<ChecklistItem> items = e.checklistItems.stream()
			.map(item -> new ChecklistItem(item.id(), item.title(), item.done()))
			.toList();
		return Task.restore(e.id, e.ownerId,
				new TaskDetails(e.title, e.description, e.projectId, e.priority, e.tag, e.startDate, e.dueDate,
						e.doneCriteria, e.checklistDone, e.checklistTotal, items, e.goalId),
				e.status, e.completedAt);
	}

}
