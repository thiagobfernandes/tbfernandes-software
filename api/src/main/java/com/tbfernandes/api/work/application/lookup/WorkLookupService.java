package com.tbfernandes.api.work.application.lookup;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.FollowUpTasks;
import com.tbfernandes.api.work.WorkLookup;
import com.tbfernandes.api.work.application.task.TaskService;
import com.tbfernandes.api.work.domain.company.CompanyRepository;
import com.tbfernandes.api.work.domain.project.ProjectRepository;
import com.tbfernandes.api.work.domain.task.TaskDetails;
import com.tbfernandes.api.work.domain.task.TaskPriority;
import com.tbfernandes.api.work.domain.task.TaskRepository;
import com.tbfernandes.api.work.domain.task.TaskRepository.TaskFilter;
import com.tbfernandes.api.work.domain.task.TaskStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implements the work module's public API (WRK-08) on top of its own ports. */
@Service
@Transactional(readOnly = true)
class WorkLookupService implements WorkLookup, FollowUpTasks {

	private final CompanyRepository companies;
	private final ProjectRepository projects;
	private final TaskRepository tasks;
	private final TaskService taskService;

	WorkLookupService(CompanyRepository companies, ProjectRepository projects, TaskRepository tasks,
			TaskService taskService) {
		this.companies = companies;
		this.projects = projects;
		this.tasks = tasks;
		this.taskService = taskService;
	}

	@Override
	public boolean companyExists(UUID ownerId, UUID companyId) {
		return companies.exists(ownerId, companyId);
	}

	@Override
	public boolean projectExists(UUID ownerId, UUID projectId) {
		return projects.exists(ownerId, projectId);
	}

	@Override
	public boolean taskExists(UUID ownerId, UUID taskId) {
		return tasks.findById(ownerId, taskId).isPresent();
	}

	@Override
	public List<CompanyView> companies(UUID ownerId) {
		return companies.findAll(ownerId).stream()
			.map(company -> new CompanyView(company.id(), company.details().name(), lower(company.status())))
			.toList();
	}

	@Override
	public List<ProjectView> projects(UUID ownerId) {
		return projects.findAll(ownerId, null).stream().map(project -> {
			var d = project.details();
			return new ProjectView(project.id(), d.name(), lower(d.status()), d.companyId(), d.goalId(), d.dueDate(),
					d.nextDelivery());
		}).toList();
	}

	@Override
	public List<TaskView> tasks(UUID ownerId) {
		return tasks.findAll(ownerId, TaskFilter.all()).stream().map(task -> {
			var d = task.details();
			return new TaskView(task.id(), d.title(), d.description(), lower(task.status()), lower(d.priority()), d.projectId(),
					d.goalId(), d.dueDate());
		}).toList();
	}

	@Override
	@Transactional
	public UUID create(String title, String description, LocalDate dueDate) {
		TaskDetails details = new TaskDetails(title, description, null, TaskPriority.NORMAL, "Follow-up", null,
				dueDate, null, null, null, null, null);
		return taskService.create(details, TaskStatus.TODO).id();
	}

	private static String lower(Enum<?> value) {
		return value.name().toLowerCase();
	}

}
