package com.tbfernandes.api.work.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.work.domain.project.Project;
import com.tbfernandes.api.work.domain.project.ProjectDetails;
import com.tbfernandes.api.work.domain.project.ProjectRepository;
import org.springframework.stereotype.Component;

@Component
class ProjectRepositoryImpl implements ProjectRepository {

	private final ProjectJpaRepository projects;

	ProjectRepositoryImpl(ProjectJpaRepository projects) {
		this.projects = projects;
	}

	@Override
	public Project save(Project project) {
		ProjectJpaEntity entity = projects.findById(project.id()).orElseGet(ProjectJpaEntity::new);
		entity.id = project.id();
		entity.ownerId = project.ownerId();
		ProjectDetails d = project.details();
		entity.name = d.name();
		entity.description = d.description();
		entity.companyId = d.companyId();
		entity.category = d.category();
		entity.status = d.status();
		entity.color = d.color();
		entity.startDate = d.startDate();
		entity.dueDate = d.dueDate();
		entity.nextDelivery = d.nextDelivery();
		entity.goalId = d.goalId();
		return toDomain(projects.save(entity));
	}

	@Override
	public Optional<Project> findById(UUID ownerId, UUID id) {
		return projects.findByOwnerIdAndId(ownerId, id).map(ProjectRepositoryImpl::toDomain);
	}

	@Override
	public List<Project> findAll(UUID ownerId, UUID companyId) {
		return projects.search(ownerId, companyId).stream().map(ProjectRepositoryImpl::toDomain).toList();
	}

	@Override
	public boolean exists(UUID ownerId, UUID id) {
		return projects.existsByOwnerIdAndId(ownerId, id);
	}

	@Override
	public boolean anyForCompany(UUID ownerId, UUID companyId) {
		return projects.existsByOwnerIdAndCompanyId(ownerId, companyId);
	}

	@Override
	public void delete(Project project) {
		projects.deleteById(project.id());
	}

	private static Project toDomain(ProjectJpaEntity e) {
		return Project.restore(e.id, e.ownerId, new ProjectDetails(e.name, e.description, e.companyId, e.category,
				e.status, e.color, e.startDate, e.dueDate, e.nextDelivery, e.goalId));
	}

}
