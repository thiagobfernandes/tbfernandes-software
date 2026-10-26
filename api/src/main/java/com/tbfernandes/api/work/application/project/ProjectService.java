package com.tbfernandes.api.work.application.project;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.NotFound;
import com.tbfernandes.api.work.ProjectDeleted;
import com.tbfernandes.api.work.domain.company.Company;
import com.tbfernandes.api.work.domain.company.CompanyRepository;
import com.tbfernandes.api.work.domain.company.CompanyStatus;
import com.tbfernandes.api.work.domain.project.Project;
import com.tbfernandes.api.work.domain.project.ProjectDetails;
import com.tbfernandes.api.work.domain.project.ProjectRepository;
import com.tbfernandes.api.work.domain.project.ProjectStatus;
import com.tbfernandes.api.work.domain.task.TaskRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Project use cases (RF-WRK-04..06, WRK-11). */
@Service
@Transactional
public class ProjectService {

	private final ProjectRepository projects;
	private final CompanyRepository companies;
	private final TaskRepository tasks;
	private final OwnerContext owner;
	private final ApplicationEventPublisher events;

	public ProjectService(ProjectRepository projects, CompanyRepository companies, TaskRepository tasks,
			OwnerContext owner, ApplicationEventPublisher events) {
		this.projects = projects;
		this.companies = companies;
		this.tasks = tasks;
		this.owner = owner;
		this.events = events;
	}

	public Project create(ProjectDetails details) {
		checkCompany(details);
		return projects.save(Project.create(owner.currentOwnerId(), details));
	}

	public Project update(UUID id, ProjectDetails details) {
		Project project = get(id);
		checkCompany(details);
		project.update(details);
		return projects.save(project);
	}

	/** RN-01: the tasks stay, without project; knowledge links are dropped by listeners. */
	public void delete(UUID id) {
		Project project = get(id);
		tasks.unlinkProject(project.ownerId(), id);
		projects.delete(project);
		events.publishEvent(new ProjectDeleted(project.ownerId(), id));
	}

	@Transactional(readOnly = true)
	public Project get(UUID id) {
		return projects.findById(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Project", id));
	}

	@Transactional(readOnly = true)
	public List<Project> list(UUID companyId) {
		return projects.findAll(owner.currentOwnerId(), companyId);
	}

	/** RN-03: the company must exist, and a closed company takes no active project. */
	private void checkCompany(ProjectDetails details) {
		if (details.companyId() == null) {
			return;
		}
		Company company = companies.findById(owner.currentOwnerId(), details.companyId())
			.orElseThrow(() -> new NotFound("Company", details.companyId()));
		if (company.status() == CompanyStatus.CLOSED && details.status() == ProjectStatus.ACTIVE) {
			throw new BusinessRuleViolation("RN-03", "A closed company cannot have an active project");
		}
	}

}
