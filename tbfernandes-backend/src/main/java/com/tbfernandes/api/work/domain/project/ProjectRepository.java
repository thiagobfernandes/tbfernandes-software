package com.tbfernandes.api.work.domain.project;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Implemented in the module's infrastructure.persistence package. */
public interface ProjectRepository {

	Project save(Project project);

	Optional<Project> findById(UUID ownerId, UUID id);

	List<Project> findAll(UUID ownerId, UUID companyId);

	boolean exists(UUID ownerId, UUID id);

	boolean anyForCompany(UUID ownerId, UUID companyId);

	void delete(Project project);

}
