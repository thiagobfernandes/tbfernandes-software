package com.tbfernandes.api.work.adapter.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.work.domain.task.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface CompanyJpaRepository extends JpaRepository<CompanyJpaEntity, UUID> {

	Optional<CompanyJpaEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<CompanyJpaEntity> findByOwnerIdOrderByName(UUID ownerId);

	boolean existsByOwnerIdAndId(UUID ownerId, UUID id);

}

interface ProjectJpaRepository extends JpaRepository<ProjectJpaEntity, UUID> {

	Optional<ProjectJpaEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	@Query("""
			select p from ProjectJpaEntity p
			where p.ownerId = :ownerId and (:companyId is null or p.companyId = :companyId)
			order by p.startDate desc""")
	List<ProjectJpaEntity> search(UUID ownerId, UUID companyId);

	boolean existsByOwnerIdAndId(UUID ownerId, UUID id);

}

interface TaskJpaRepository extends JpaRepository<TaskJpaEntity, UUID> {

	Optional<TaskJpaEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	@Query("""
			select t from TaskJpaEntity t
			where t.ownerId = :ownerId
			  and (:projectId is null or t.projectId = :projectId)
			  and (:status is null or t.status = :status)
			order by t.dueDate asc nulls last, t.createdAt""")
	List<TaskJpaEntity> search(UUID ownerId, UUID projectId, TaskStatus status);

}
