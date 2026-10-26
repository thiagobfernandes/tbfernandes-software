package com.tbfernandes.api.learning;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Read access to learning data for other modules (goals, assistant). */
public interface LearningLookup {

	List<StudyView> studies(UUID ownerId);

	List<CertificationView> certifications(UUID ownerId);

	record StudyView(UUID id, String name, String status, UUID goalId, LocalDate dueDate) {
	}

	record CertificationView(UUID id, String name, String issuer, String status, LocalDate expiresAt) {
	}

}
