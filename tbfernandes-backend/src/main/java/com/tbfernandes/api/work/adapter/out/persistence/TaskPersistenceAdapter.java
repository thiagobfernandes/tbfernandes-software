package com.tbfernandes.api.work.adapter.out.persistence;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.work.domain.task.ChecklistItem;
import com.tbfernandes.api.work.domain.task.Task;
import com.tbfernandes.api.work.domain.task.TaskDetails;
import com.tbfernandes.api.work.domain.task.TaskRepository;
import com.tbfernandes.api.work.domain.task.TaskStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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
		Specification<TaskJpaEntity> spec = (root, query, cb) -> {
			List<Predicate> where = new ArrayList<>();
			where.add(cb.equal(root.get("ownerId"), ownerId));
			if (filter.projectId() != null) {
				where.add(cb.equal(root.get("projectId"), filter.projectId()));
			}
			if (filter.status() != null) {
				where.add(cb.equal(root.get("status"), filter.status()));
			}
			if (filter.dueFrom() != null) {
				where.add(cb.greaterThanOrEqualTo(root.get("dueDate"), filter.dueFrom()));
			}
			if (filter.dueTo() != null) {
				where.add(cb.lessThanOrEqualTo(root.get("dueDate"), filter.dueTo()));
			}
			if (filter.overdueOn() != null) {
				where.add(cb.lessThan(root.get("dueDate"), filter.overdueOn()));
				where.add(root.get("status").in(TaskStatus.DONE, TaskStatus.CANCELED).not());
			}
			return cb.and(where.toArray(Predicate[]::new));
		};
		Sort sort = Sort.by(Sort.Order.asc("dueDate").nullsLast(), Sort.Order.asc("createdAt"));
		return tasks.findAll(spec, sort).stream().map(TaskPersistenceAdapter::toDomain).toList();
	}

	@Override
	public void unlinkProject(UUID ownerId, UUID projectId) {
		tasks.unlinkProject(ownerId, projectId);
	}

	@Override
	public long countCompletedSince(UUID ownerId, Instant since) {
		return tasks.countByOwnerIdAndCompletedAtGreaterThanEqual(ownerId, since);
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
