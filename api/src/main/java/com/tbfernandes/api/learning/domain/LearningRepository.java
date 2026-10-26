package com.tbfernandes.api.learning.domain;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Output port for every learning aggregate. All reads are scoped to the owner. */
public interface LearningRepository {

	Study save(Study study);

	Optional<Study> findStudy(UUID ownerId, UUID id);

	List<Study> findStudies(UUID ownerId);

	void delete(Study study);

	Material save(Material material);

	Optional<Material> findMaterial(UUID ownerId, UUID id);

	List<Material> findMaterials(UUID ownerId, UUID studyId);

	void delete(Material material);

	Skill save(Skill skill);

	Optional<Skill> findSkill(UUID ownerId, UUID id);

	List<Skill> findSkills(UUID ownerId);

	boolean skillsExist(UUID ownerId, Set<UUID> ids);

	boolean studiesExist(UUID ownerId, Set<UUID> ids);

	void delete(Skill skill);

	Certification save(Certification certification);

	Optional<Certification> findCertification(UUID ownerId, UUID id);

	List<Certification> findCertifications(UUID ownerId);

	void delete(Certification certification);

	Education save(Education education);

	Optional<Education> findEducation(UUID ownerId, UUID id);

	List<Education> findEducations(UUID ownerId);

	void delete(Education education);

}
