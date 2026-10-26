package com.tbfernandes.api.learning.domain;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** A skill with a self-declared level from 1 to 5 (RF-LRN-03, RN-13). */
public final class Skill extends Aggregate<Skill.Details> {

	private Skill(UUID id, UUID ownerId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static Skill create(UUID ownerId, Details details) {
		return new Skill(Ids.newId(), ownerId, details, true);
	}

	public static Skill restore(UUID id, UUID ownerId, Details details) {
		return new Skill(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		if (d.level() < 1 || d.level() > 5) {
			throw new BusinessRuleViolation("RN-13", "Skill level goes from 1 to 5");
		}
		return new Details(Require.text(d.name(), "name", 120), d.level(), Require.optionalText(d.evidence(), "evidence", 2000));
	}

	public record Details(String name, int level, String evidence) {
	}

}
