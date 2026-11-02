package com.tbfernandes.api.work.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
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

	boolean existsByOwnerIdAndCompanyId(UUID ownerId, UUID companyId);

}

interface TaskJpaRepository extends JpaRepository<TaskJpaEntity, UUID>, JpaSpecificationExecutor<TaskJpaEntity> {

	Optional<TaskJpaEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	boolean existsByOwnerIdAndId(UUID ownerId, UUID id);

	long countByOwnerIdAndCompletedAtGreaterThanEqual(UUID ownerId, Instant since);

	@Modifying
	@Query("update TaskJpaEntity t set t.projectId = null where t.ownerId = :ownerId and t.projectId = :projectId")
	void unlinkProject(UUID ownerId, UUID projectId);

}
