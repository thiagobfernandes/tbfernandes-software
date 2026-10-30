package com.tbfernandes.api.work.application.dashboard;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.work.domain.company.CompanyRepository;
import com.tbfernandes.api.work.domain.company.CompanyStatus;
import com.tbfernandes.api.work.domain.project.ProjectRepository;
import com.tbfernandes.api.work.domain.project.ProjectStatus;
import com.tbfernandes.api.work.domain.task.Task;
import com.tbfernandes.api.work.domain.task.TaskRepository;
import com.tbfernandes.api.work.domain.task.TaskRepository.TaskFilter;
import com.tbfernandes.api.work.domain.task.TaskStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** WRK-07. "Today" and "this week" (from Monday) use the configured time zone. */
@Service
@Transactional(readOnly = true)
public class WorkSummaryService {

	private final TaskRepository tasks;
	private final ProjectRepository projects;
	private final CompanyRepository companies;
	private final OwnerContext owner;
	private final Clock clock;

	public WorkSummaryService(TaskRepository tasks, ProjectRepository projects, CompanyRepository companies,
			OwnerContext owner, Clock clock) {
		this.tasks = tasks;
		this.projects = projects;
		this.companies = companies;
		this.owner = owner;
		this.clock = clock;
	}

	public WorkSummary summary() {
		UUID ownerId = owner.currentOwnerId();
		LocalDate today = LocalDate.now(clock);
		List<Task> open = tasks.findAll(ownerId, TaskFilter.all())
			.stream()
			.filter(task -> task.status() != TaskStatus.DONE && task.status() != TaskStatus.CANCELED)
			.toList();
		LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
		return new WorkSummary(open.size(),
				open.stream().filter(task -> due(task) != null && due(task).isBefore(today)).count(),
				open.stream().filter(task -> task.status() == TaskStatus.BLOCKED).count(),
				open.stream().filter(task -> today.equals(due(task))).count(),
				tasks.countCompletedSince(ownerId, monday.atStartOfDay(clock.getZone()).toInstant()),
				projects.findAll(ownerId, null)
					.stream()
					.filter(project -> project.details().status() == ProjectStatus.ACTIVE)
					.count(),
				companies.findAll(ownerId).stream().filter(company -> company.status() == CompanyStatus.ACTIVE).count());
	}

	private static LocalDate due(Task task) {
		return task.details().dueDate();
	}

}
