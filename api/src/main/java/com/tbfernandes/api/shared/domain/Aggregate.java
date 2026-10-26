package com.tbfernandes.api.shared.domain;

import java.util.UUID;

/**
 * Base for aggregates whose editable state is one immutable "details" record: every change
 * goes through {@link #validate}, so an invalid state can never be stored. Work's Project
 * follows the same shape by hand; newer modules extend this class.
 *
 * @param <D> the details record
 */
public abstract class Aggregate<D> {

	private final UUID id;
	private final UUID ownerId;
	private D details;

	protected Aggregate(UUID id, UUID ownerId, D details, boolean validate) {
		this.id = Require.present(id, "id");
		this.ownerId = Require.present(ownerId, "ownerId");
		this.details = validate ? validate(details) : details;
	}

	/** Checks the invariants and returns the normalized details. */
	protected abstract D validate(D details);

	public void update(D details) {
		this.details = validate(details);
	}

	public UUID id() {
		return id;
	}

	public UUID ownerId() {
		return ownerId;
	}

	public D details() {
		return details;
	}

}
