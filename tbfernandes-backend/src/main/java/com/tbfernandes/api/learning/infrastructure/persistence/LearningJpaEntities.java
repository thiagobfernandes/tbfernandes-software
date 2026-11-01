package com.tbfernandes.api.learning.infrastructure.persistence;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.learning.domain.CertificationStatus;
import com.tbfernandes.api.learning.domain.EducationStatus;
import com.tbfernandes.api.learning.domain.MaterialStatus;
import com.tbfernandes.api.learning.domain.MaterialType;
import com.tbfernandes.api.learning.domain.StudyStatus;
import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

/** JPA mappings of the learning schema, one class per table. */
final class LearningJpaEntities {

	private LearningJpaEntities() {
	}

	@Entity
	@Table(schema = "learning", name = "study")
	static class StudyEntity extends AuditedEntity {

		String name;

		String description;

		@Enumerated(EnumType.STRING)
		StudyStatus status;

		UUID goalId;

		LocalDate startDate;

		LocalDate dueDate;

		String nextActivity;

		@ElementCollection
		@CollectionTable(schema = "learning", name = "study_skill", joinColumns = @JoinColumn(name = "study_id"))
		@Column(name = "skill_id")
		Set<UUID> skillIds = new HashSet<>();

	}

	@Entity
	@Table(schema = "learning", name = "material")
	static class MaterialEntity extends AuditedEntity {

		UUID studyId;

		String title;

		@Enumerated(EnumType.STRING)
		MaterialType type;

		String url;

		@Enumerated(EnumType.STRING)
		MaterialStatus status;

		String notes;

	}

	@Entity
	@Table(schema = "learning", name = "skill")
	static class SkillEntity extends AuditedEntity {

		String name;

		short level;

		String evidence;

	}

	@Entity
	@Table(schema = "learning", name = "certification")
	static class CertificationEntity extends AuditedEntity {

		String name;

		String issuer;

		@Enumerated(EnumType.STRING)
		CertificationStatus status;

		LocalDate obtainedAt;

		LocalDate expiresAt;

		String validationUrl;

		@ElementCollection
		@CollectionTable(schema = "learning", name = "certification_study",
				joinColumns = @JoinColumn(name = "certification_id"))
		@Column(name = "study_id")
		Set<UUID> studyIds = new HashSet<>();

	}

	@Entity
	@Table(schema = "learning", name = "education")
	static class EducationEntity extends AuditedEntity {

		String institution;

		String course;

		String degree;

		@Enumerated(EnumType.STRING)
		EducationStatus status;

		LocalDate startDate;

		LocalDate endDate;

	}

}
