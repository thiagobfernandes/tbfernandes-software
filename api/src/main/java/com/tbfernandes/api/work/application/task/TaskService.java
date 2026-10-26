package com.tbfernandes.api.work.application.task;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.NotFound;
import com.tbfernandes.api.work.TaskCompleted;
import com.tbfernandes.api.work.domain.project.ProjectRepository;
import com.tbfernandes.api.work.domain.task.Task;
import com.tbfernandes.api.work.domain.task.TaskDetails;
import com.tbfernandes.api.work.domain.task.TaskRepository;
import com.tbfernandes.api.work.domain.task.TaskRepository.TaskFilter;
import com.tbfernandes.api.work.domain.task.TaskStatus;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Task use cases (RF-WRK-07..11). Publishes {@link TaskCompleted} inside the transaction. */
@Service
@Transactional
public class TaskService {

	private final TaskRepository tasks;
	private final ProjectRepository projects;
	private final OwnerContext owner;
	private final ApplicationEventPublisher events;
	private final Clock clock;

	public TaskService(TaskRepository tasks, ProjectRepository projects, OwnerContext owner,
			ApplicationEventPublisher events, Clock clock) {
		this.tasks = tasks;
		this.projects = projects;
		this.owner = owner;
		this.events = events;
		this.clock = clock;
	}

	public Task create(TaskDetails details, TaskStatus status) {
		checkProject(details.projectId());
		Task task = tasks.save(Task.create(owner.currentOwnerId(), details, status, clock));
		if (task.status() == TaskStatus.DONE) {
			publishCompleted(task);
		}
		return task;
	}

	public Task update(UUID id, TaskDetails details) {
		Task task = get(id);
		checkProject(details.projectId());
		task.update(details);
		return tasks.save(task);
	}

	/** Used by the board drag and drop and the status menu. */
	public Task changeStatus(UUID id, TaskStatus status) {
		Task task = get(id);
		boolean completed = task.changeStatus(status, clock);
		Task saved = tasks.save(task);
		if (completed) {
			publishCompleted(saved);
		}
		return saved;
	}

	public void delete(UUID id) {
		tasks.delete(get(id));
	}

	@Transactional(readOnly = true)
	public Task get(UUID id) {
		return tasks.findById(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Task", id));
	}

	@Transactional(readOnly = true)
	public List<Task> list(TaskFilter filter) {
		return tasks.findAll(owner.currentOwnerId(), filter);
	}

	private void checkProject(UUID projectId) {
		if (projectId != null && !projects.exists(owner.currentOwnerId(), projectId)) {
			throw new NotFound("Project", projectId);
		}
	}

	private void publishCompleted(Task task) {
		events.publishEvent(new TaskCompleted(task.ownerId(), task.id(), task.details().projectId(),
				task.details().goalId(), task.completedAt()));
	}

}
