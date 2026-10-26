package com.tbfernandes.api.learning.domain;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** Formal education: degree, course, institution (RF-LRN-05). */
public final class Education extends Aggregate<Education.Details> {

	private Education(UUID id, UUID ownerId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static Education create(UUID ownerId, Details details) {
		return new Education(Ids.forNewAggregate(), ownerId, details, true);
	}

	public static Education restore(UUID id, UUID ownerId, Details details) {
		return new Education(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		Require.present(d.startDate(), "startDate");
		Require.dateOrder(d.startDate(), d.endDate(), "endDate");
		return new Details(Require.text(d.institution(), "institution", 200), Require.text(d.course(), "course", 200),
				Require.text(d.degree(), "degree", 80), Require.present(d.status(), "status"), d.startDate(), d.endDate());
	}

	public record Details(String institution, String course, String degree, EducationStatus status, LocalDate startDate,
			LocalDate endDate) {
	}

}
