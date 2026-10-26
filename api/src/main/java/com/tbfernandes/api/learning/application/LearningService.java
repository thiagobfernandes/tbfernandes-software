package com.tbfernandes.api.learning.application;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiFunction;

import com.tbfernandes.api.learning.LearningLookup;
import com.tbfernandes.api.learning.domain.Certification;
import com.tbfernandes.api.learning.domain.CertificationStatus;
import com.tbfernandes.api.learning.domain.Education;
import com.tbfernandes.api.learning.domain.LearningRepository;
import com.tbfernandes.api.learning.domain.Material;
import com.tbfernandes.api.learning.domain.Skill;
import com.tbfernandes.api.learning.domain.Study;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.NotFound;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Learning use cases (RF-LRN-01..06). Each aggregate is small, so one service holds them;
 * the rules that cross aggregates (references between studies, skills and certifications)
 * live here.
 */
@Service
@Transactional
public class LearningService implements LearningLookup {

	private final LearningRepository repository;
	private final OwnerContext owner;
	private final Clock clock;

	LearningService(LearningRepository repository, OwnerContext owner, Clock clock) {
		this.repository = repository;
		this.owner = owner;
		this.clock = clock;
	}

	// Studies

	public Study createStudy(Study.Details details) {
		checkSkills(details.skillIds());
		return repository.save(Study.create(owner.currentOwnerId(), details));
	}

	public Study updateStudy(UUID id, Study.Details details) {
		Study study = study(id);
		checkSkills(details.skillIds());
		study.update(details);
		return repository.save(study);
	}

	/** Materials of the study stay, without study (ON DELETE SET NULL). */
	public void deleteStudy(UUID id) {
		repository.delete(study(id));
	}

	@Transactional(readOnly = true)
	public Study study(UUID id) {
		return found(repository::findStudy, id, "Study");
	}

	@Transactional(readOnly = true)
	public List<Study> listStudies() {
		return repository.findStudies(owner.currentOwnerId());
	}

	// Materials

	public Material createMaterial(Material.Details details) {
		checkStudy(details.studyId());
		return repository.save(Material.create(owner.currentOwnerId(), details));
	}

	public Material updateMaterial(UUID id, Material.Details details) {
		Material material = material(id);
		checkStudy(details.studyId());
		material.update(details);
		return repository.save(material);
	}

	public void deleteMaterial(UUID id) {
		repository.delete(material(id));
	}

	@Transactional(readOnly = true)
	public Material material(UUID id) {
		return found(repository::findMaterial, id, "Material");
	}

	@Transactional(readOnly = true)
	public List<Material> listMaterials(UUID studyId) {
		return repository.findMaterials(owner.currentOwnerId(), studyId);
	}

	// Skills

	public Skill createSkill(Skill.Details details) {
		return repository.save(Skill.create(owner.currentOwnerId(), details));
	}

	public Skill updateSkill(UUID id, Skill.Details details) {
		Skill skill = skill(id);
		skill.update(details);
		return repository.save(skill);
	}

	public void deleteSkill(UUID id) {
		repository.delete(skill(id));
	}

	@Transactional(readOnly = true)
	public Skill skill(UUID id) {
		return found(repository::findSkill, id, "Skill");
	}

	@Transactional(readOnly = true)
	public List<Skill> listSkills() {
		return repository.findSkills(owner.currentOwnerId());
	}

	// Certifications

	public Certification createCertification(Certification.Details details) {
		checkStudies(details.studyIds());
		return repository.save(Certification.create(owner.currentOwnerId(), details));
	}

	public Certification updateCertification(UUID id, Certification.Details details) {
		Certification certification = certification(id);
		checkStudies(details.studyIds());
		certification.update(details);
		return repository.save(certification);
	}

	public void deleteCertification(UUID id) {
		repository.delete(certification(id));
	}

	@Transactional(readOnly = true)
	public Certification certification(UUID id) {
		return found(repository::findCertification, id, "Certification");
	}

	/** LRN-06: with expiringWithinDays, only obtained certifications that expire in that window. */
	@Transactional(readOnly = true)
	public List<Certification> listCertifications(Integer expiringWithinDays) {
		List<Certification> all = repository.findCertifications(owner.currentOwnerId());
		if (expiringWithinDays == null) {
			return all;
		}
		LocalDate today = LocalDate.now(clock);
		LocalDate limit = today.plusDays(expiringWithinDays);
		return all.stream().filter(c -> {
			Certification.Details d = c.details();
			return d.status() == CertificationStatus.OBTAINED && d.expiresAt() != null
					&& !d.expiresAt().isBefore(today) && !d.expiresAt().isAfter(limit);
		}).toList();
	}

	// Educations

	public Education createEducation(Education.Details details) {
		return repository.save(Education.create(owner.currentOwnerId(), details));
	}

	public Education updateEducation(UUID id, Education.Details details) {
		Education education = education(id);
		education.update(details);
		return repository.save(education);
	}

	public void deleteEducation(UUID id) {
		repository.delete(education(id));
	}

	@Transactional(readOnly = true)
	public Education education(UUID id) {
		return found(repository::findEducation, id, "Education");
	}

	@Transactional(readOnly = true)
	public List<Education> listEducations() {
		return repository.findEducations(owner.currentOwnerId());
	}

	// Public API for other modules

	@Override
	@Transactional(readOnly = true)
	public List<StudyView> studies(UUID ownerId) {
		return repository.findStudies(ownerId)
			.stream()
			.map(s -> new StudyView(s.id(), s.details().name(), s.details().status().name().toLowerCase(),
					s.details().goalId(), s.details().dueDate()))
			.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<CertificationView> certifications(UUID ownerId) {
		return repository.findCertifications(ownerId)
			.stream()
			.map(c -> new CertificationView(c.id(), c.details().name(), c.details().issuer(),
					c.details().status().name().toLowerCase(), c.details().expiresAt()))
			.toList();
	}

	// Reference checks (RN-05 inside the module)

	private void checkSkills(Set<UUID> ids) {
		if (ids != null && !repository.skillsExist(owner.currentOwnerId(), ids)) {
			throw new NotFound("Skill", ids.iterator().next());
		}
	}

	private void checkStudies(Set<UUID> ids) {
		if (ids != null && !repository.studiesExist(owner.currentOwnerId(), ids)) {
			throw new NotFound("Study", ids.iterator().next());
		}
	}

	private void checkStudy(UUID id) {
		if (id != null) {
			study(id);
		}
	}

	private <T> T found(BiFunction<UUID, UUID, Optional<T>> finder, UUID id, String resource) {
		return finder.apply(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound(resource, id));
	}

}
