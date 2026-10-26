package com.tbfernandes.api.learning.domain;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** A certification, planned or obtained (RF-LRN-04, RN-14). */
public final class Certification extends Aggregate<Certification.Details> {

	private Certification(UUID id, UUID ownerId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static Certification create(UUID ownerId, Details details) {
		return new Certification(Ids.newId(), ownerId, details, true);
	}

	public static Certification restore(UUID id, UUID ownerId, Details details) {
		return new Certification(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		CertificationStatus status = d.status() == null ? CertificationStatus.PLANNED : d.status();
		if (status == CertificationStatus.OBTAINED && d.obtainedAt() == null) {
			throw new BusinessRuleViolation("RN-14", "An obtained certification needs the date it was obtained");
		}
		if (d.obtainedAt() != null && d.expiresAt() != null && !d.expiresAt().isAfter(d.obtainedAt())) {
			throw new BusinessRuleViolation("RN-14", "Expiry must be after the date obtained");
		}
		return new Details(Require.text(d.name(), "name", 200), Require.text(d.issuer(), "issuer", 120), status,
				d.obtainedAt(), d.expiresAt(), Require.optionalText(d.validationUrl(), "validationUrl", 2000),
				d.studyIds() == null ? Set.of() : Set.copyOf(d.studyIds()));
	}

	public record Details(String name, String issuer, CertificationStatus status, LocalDate obtainedAt, LocalDate expiresAt,
			String validationUrl, Set<UUID> studyIds) {
	}

}
