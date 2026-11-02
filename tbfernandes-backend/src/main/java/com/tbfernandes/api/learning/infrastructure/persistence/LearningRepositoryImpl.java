package com.tbfernandes.api.learning.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.learning.infrastructure.persistence.LearningJpaEntities.CertificationEntity;
import com.tbfernandes.api.learning.infrastructure.persistence.LearningJpaEntities.EducationEntity;
import com.tbfernandes.api.learning.infrastructure.persistence.LearningJpaEntities.MaterialEntity;
import com.tbfernandes.api.learning.infrastructure.persistence.LearningJpaEntities.SkillEntity;
import com.tbfernandes.api.learning.infrastructure.persistence.LearningJpaEntities.StudyEntity;
import com.tbfernandes.api.learning.domain.Certification;
import com.tbfernandes.api.learning.domain.Education;
import com.tbfernandes.api.learning.domain.LearningRepository;
import com.tbfernandes.api.learning.domain.Material;
import com.tbfernandes.api.learning.domain.Skill;
import com.tbfernandes.api.learning.domain.Study;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
class LearningRepositoryImpl implements LearningRepository {

	private final StudyJpa studies;
	private final MaterialJpa materials;
	private final SkillJpa skills;
	private final CertificationJpa certifications;
	private final EducationJpa educations;

	LearningRepositoryImpl(StudyJpa studies, MaterialJpa materials, SkillJpa skills,
			CertificationJpa certifications, EducationJpa educations) {
		this.studies = studies;
		this.materials = materials;
		this.skills = skills;
		this.certifications = certifications;
		this.educations = educations;
	}

	// Studies

	@Override
	public Study save(Study study) {
		StudyEntity e = studies.findById(study.id()).orElseGet(StudyEntity::new);
		e.id = study.id();
		e.ownerId = study.ownerId();
		Study.Details d = study.details();
		e.name = d.name();
		e.description = d.description();
		e.status = d.status();
		e.goalId = d.goalId();
		e.startDate = d.startDate();
		e.dueDate = d.dueDate();
		e.nextActivity = d.nextActivity();
		e.skillIds.clear();
		e.skillIds.addAll(d.skillIds());
		return toDomain(studies.save(e));
	}

	@Override
	public Optional<Study> findStudy(UUID ownerId, UUID id) {
		return studies.findByOwnerIdAndId(ownerId, id).map(LearningRepositoryImpl::toDomain);
	}

	@Override
	public List<Study> findStudies(UUID ownerId) {
		return studies.findByOwnerId(ownerId, Sort.by("name")).stream().map(LearningRepositoryImpl::toDomain).toList();
	}

	@Override
	public void delete(Study study) {
		studies.deleteById(study.id());
	}

	private static Study toDomain(StudyEntity e) {
		return Study.restore(e.id, e.ownerId, new Study.Details(e.name, e.description, e.status, e.goalId,
				Set.copyOf(e.skillIds), e.startDate, e.dueDate, e.nextActivity));
	}

	// Materials

	@Override
	public Material save(Material material) {
		MaterialEntity e = materials.findById(material.id()).orElseGet(MaterialEntity::new);
		e.id = material.id();
		e.ownerId = material.ownerId();
		Material.Details d = material.details();
		e.studyId = d.studyId();
		e.title = d.title();
		e.type = d.type();
		e.url = d.url();
		e.status = d.status();
		e.notes = d.notes();
		return toDomain(materials.save(e));
	}

	@Override
	public Optional<Material> findMaterial(UUID ownerId, UUID id) {
		return materials.findByOwnerIdAndId(ownerId, id).map(LearningRepositoryImpl::toDomain);
	}

	@Override
	public List<Material> findMaterials(UUID ownerId, UUID studyId) {
		List<MaterialEntity> rows = studyId == null ? materials.findByOwnerId(ownerId, Sort.by("title"))
				: materials.findByOwnerIdAndStudyId(ownerId, studyId, Sort.by("title"));
		return rows.stream().map(LearningRepositoryImpl::toDomain).toList();
	}

	@Override
	public void delete(Material material) {
		materials.deleteById(material.id());
	}

	private static Material toDomain(MaterialEntity e) {
		return Material.restore(e.id, e.ownerId,
				new Material.Details(e.studyId, e.title, e.type, e.url, e.status, e.notes));
	}

	// Skills

	@Override
	public Skill save(Skill skill) {
		SkillEntity e = skills.findById(skill.id()).orElseGet(SkillEntity::new);
		e.id = skill.id();
		e.ownerId = skill.ownerId();
		e.name = skill.details().name();
		e.level = (short) skill.details().level();
		e.evidence = skill.details().evidence();
		return toDomain(skills.save(e));
	}

	@Override
	public Optional<Skill> findSkill(UUID ownerId, UUID id) {
		return skills.findByOwnerIdAndId(ownerId, id).map(LearningRepositoryImpl::toDomain);
	}

	@Override
	public List<Skill> findSkills(UUID ownerId) {
		return skills.findByOwnerId(ownerId, Sort.by("name")).stream().map(LearningRepositoryImpl::toDomain).toList();
	}

	@Override
	public boolean skillsExist(UUID ownerId, Set<UUID> ids) {
		return ids.isEmpty() || skills.countByOwnerIdAndIdIn(ownerId, ids) == ids.size();
	}

	@Override
	public boolean studiesExist(UUID ownerId, Set<UUID> ids) {
		return ids.isEmpty() || studies.countByOwnerIdAndIdIn(ownerId, ids) == ids.size();
	}

	@Override
	public void delete(Skill skill) {
		skills.deleteById(skill.id());
	}

	private static Skill toDomain(SkillEntity e) {
		return Skill.restore(e.id, e.ownerId, new Skill.Details(e.name, e.level, e.evidence));
	}

	// Certifications

	@Override
	public Certification save(Certification certification) {
		CertificationEntity e = certifications.findById(certification.id()).orElseGet(CertificationEntity::new);
		e.id = certification.id();
		e.ownerId = certification.ownerId();
		Certification.Details d = certification.details();
		e.name = d.name();
		e.issuer = d.issuer();
		e.status = d.status();
		e.obtainedAt = d.obtainedAt();
		e.expiresAt = d.expiresAt();
		e.validationUrl = d.validationUrl();
		e.studyIds.clear();
		e.studyIds.addAll(d.studyIds());
		return toDomain(certifications.save(e));
	}

	@Override
	public Optional<Certification> findCertification(UUID ownerId, UUID id) {
		return certifications.findByOwnerIdAndId(ownerId, id).map(LearningRepositoryImpl::toDomain);
	}

	@Override
	public List<Certification> findCertifications(UUID ownerId) {
		return certifications.findByOwnerId(ownerId, Sort.by("name"))
			.stream()
			.map(LearningRepositoryImpl::toDomain)
			.toList();
	}

	@Override
	public void delete(Certification certification) {
		certifications.deleteById(certification.id());
	}

	private static Certification toDomain(CertificationEntity e) {
		return Certification.restore(e.id, e.ownerId, new Certification.Details(e.name, e.issuer, e.status,
				e.obtainedAt, e.expiresAt, e.validationUrl, Set.copyOf(e.studyIds)));
	}

	// Educations

	@Override
	public Education save(Education education) {
		EducationEntity e = educations.findById(education.id()).orElseGet(EducationEntity::new);
		e.id = education.id();
		e.ownerId = education.ownerId();
		Education.Details d = education.details();
		e.institution = d.institution();
		e.course = d.course();
		e.degree = d.degree();
		e.status = d.status();
		e.startDate = d.startDate();
		e.endDate = d.endDate();
		return toDomain(educations.save(e));
	}

	@Override
	public Optional<Education> findEducation(UUID ownerId, UUID id) {
		return educations.findByOwnerIdAndId(ownerId, id).map(LearningRepositoryImpl::toDomain);
	}

	@Override
	public List<Education> findEducations(UUID ownerId) {
		return educations.findByOwnerId(ownerId, Sort.by(Sort.Direction.DESC, "startDate"))
			.stream()
			.map(LearningRepositoryImpl::toDomain)
			.toList();
	}

	@Override
	public void delete(Education education) {
		educations.deleteById(education.id());
	}

	private static Education toDomain(EducationEntity e) {
		return Education.restore(e.id, e.ownerId, new Education.Details(e.institution, e.course, e.degree, e.status,
				e.startDate, e.endDate));
	}

}

interface StudyJpa extends JpaRepository<StudyEntity, UUID> {

	Optional<StudyEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<StudyEntity> findByOwnerId(UUID ownerId, Sort sort);

	long countByOwnerIdAndIdIn(UUID ownerId, Set<UUID> ids);

}

interface MaterialJpa extends JpaRepository<MaterialEntity, UUID> {

	Optional<MaterialEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<MaterialEntity> findByOwnerId(UUID ownerId, Sort sort);

	List<MaterialEntity> findByOwnerIdAndStudyId(UUID ownerId, UUID studyId, Sort sort);

}

interface SkillJpa extends JpaRepository<SkillEntity, UUID> {

	Optional<SkillEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<SkillEntity> findByOwnerId(UUID ownerId, Sort sort);

	long countByOwnerIdAndIdIn(UUID ownerId, Set<UUID> ids);

}

interface CertificationJpa extends JpaRepository<CertificationEntity, UUID> {

	Optional<CertificationEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<CertificationEntity> findByOwnerId(UUID ownerId, Sort sort);

}

interface EducationJpa extends JpaRepository<EducationEntity, UUID> {

	Optional<EducationEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<EducationEntity> findByOwnerId(UUID ownerId, Sort sort);

}
