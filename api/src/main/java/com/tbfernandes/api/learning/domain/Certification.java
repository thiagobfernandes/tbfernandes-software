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
		return new Certification(Ids.forNewAggregate(), ownerId, details, true);
	}

	public static Certification restore(UUID id, UUID ownerId, Details details) {
		return new Certification(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		CertificationStatus status = d.status() == null ? CertificationStatus.PLANNED : d.status();
		if (status == CertificationStatus.OBTAINED && d.obtainedAt() == null) {
			throw new BusinessRuleViolation("RN-14", "Uma certificação obtida precisa da data de obtenção");
		}
		if (d.obtainedAt() != null && d.expiresAt() != null && !d.expiresAt().isAfter(d.obtainedAt())) {
			throw new BusinessRuleViolation("RN-14", "O vencimento precisa ser depois da data de obtenção");
		}
		return new Details(Require.text(d.name(), "name", 200), Require.text(d.issuer(), "issuer", 120), status,
				d.obtainedAt(), d.expiresAt(), Require.optionalText(d.validationUrl(), "validationUrl", 2000),
				d.studyIds() == null ? Set.of() : Set.copyOf(d.studyIds()));
	}

	public record Details(String name, String issuer, CertificationStatus status, LocalDate obtainedAt, LocalDate expiresAt,
			String validationUrl, Set<UUID> studyIds) {
	}

}
