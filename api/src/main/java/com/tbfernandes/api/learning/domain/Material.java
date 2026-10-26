package com.tbfernandes.api.learning.domain;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** Something to read, watch or practice (RF-LRN-02). Consuming it is not the same as mastering the topic. */
public final class Material extends Aggregate<Material.Details> {

	private Material(UUID id, UUID ownerId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static Material create(UUID ownerId, Details details) {
		return new Material(Ids.newId(), ownerId, details, true);
	}

	public static Material restore(UUID id, UUID ownerId, Details details) {
		return new Material(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		return new Details(d.studyId(), Require.text(d.title(), "title", 300), Require.present(d.type(), "type"),
				Require.optionalText(d.url(), "url", 2000), d.status() == null ? MaterialStatus.TO_CONSUME : d.status(),
				Require.optionalText(d.notes(), "notes", 5000));
	}

	public record Details(UUID studyId, String title, MaterialType type, String url, MaterialStatus status, String notes) {
	}

}
