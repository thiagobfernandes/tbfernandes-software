package com.tbfernandes.api.contacts.domain;

import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** Something that happened with a contact (RF-CTC-02). followUpTaskId points to work.task. */
public final class Interaction extends Aggregate<Interaction.Details> {

	private Interaction(UUID id, UUID ownerId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static Interaction create(UUID ownerId, Details details) {
		return new Interaction(Ids.forNewAggregate(), ownerId, details, true);
	}

	public static Interaction restore(UUID id, UUID ownerId, Details details) {
		return new Interaction(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		return new Details(Require.present(d.contactId(), "contactId"), Require.present(d.date(), "date"),
				Require.present(d.kind(), "kind"), Require.text(d.summary(), "summary", 2000), d.followUpTaskId());
	}

	/** RF-CTC-03: one follow-up per interaction. */
	public void followUpCreated(UUID taskId) {
		if (details().followUpTaskId() != null) {
			throw new BusinessRuleViolation("RN-24", "This interaction already has a follow-up task");
		}
		Details d = details();
		update(new Details(d.contactId(), d.date(), d.kind(), d.summary(), taskId));
	}

	public void followUpDeleted() {
		Details d = details();
		update(new Details(d.contactId(), d.date(), d.kind(), d.summary(), null));
	}

	public record Details(UUID contactId, LocalDate date, InteractionKind kind, String summary, UUID followUpTaskId) {
	}

}
