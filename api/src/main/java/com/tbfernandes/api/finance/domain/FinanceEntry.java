package com.tbfernandes.api.finance.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/**
 * Income or expense (RF-FIN-01). The amount is always positive; kind gives the direction.
 * Business revenue is not personal income, so every entry has a scope (RN-12).
 */
public final class FinanceEntry extends Aggregate<FinanceEntry.Details> {

	private final EntrySource source;
	private final String externalId;

	private FinanceEntry(UUID id, UUID ownerId, Details details, EntrySource source, String externalId,
			boolean validate) {
		super(id, ownerId, details, validate);
		this.source = source;
		this.externalId = externalId;
	}

	public static FinanceEntry create(UUID ownerId, Details details) {
		return new FinanceEntry(Ids.newId(), ownerId, details, EntrySource.MANUAL, null, true);
	}

	/** Entry imported from open finance; externalId keeps imports idempotent (RN-16). */
	public static FinanceEntry imported(UUID ownerId, Details details, String externalId) {
		return new FinanceEntry(Ids.newId(), ownerId, details, EntrySource.OPEN_FINANCE,
				Require.text(externalId, "externalId", 120), true);
	}

	public static FinanceEntry restore(UUID id, UUID ownerId, Details details, EntrySource source,
			String externalId) {
		return new FinanceEntry(id, ownerId, details, source, externalId, false);
	}

	@Override
	protected Details validate(Details d) {
		return new Details(Require.present(d.kind(), "kind"), Require.present(d.scope(), "scope"),
				Require.text(d.category(), "category", 60), Require.text(d.description(), "description", 300),
				Money.positive(d.amount(), "amount"), Require.present(d.date(), "date"), d.recurring());
	}

	/** Positive for income, negative for expense. */
	public BigDecimal signedAmount() {
		return details().kind() == EntryKind.INCOME ? details().amount() : details().amount().negate();
	}

	public EntrySource source() {
		return source;
	}

	public String externalId() {
		return externalId;
	}

	public record Details(EntryKind kind, EntryScope scope, String category, String description, BigDecimal amount,
			LocalDate date, boolean recurring) {
	}

}
