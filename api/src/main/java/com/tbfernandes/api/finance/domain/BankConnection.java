package com.tbfernandes.api.finance.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/**
 * One bank login at the open finance provider (RF-FIN-05). Everything imported through it takes
 * its scope (RN-20).
 */
public final class BankConnection extends Aggregate<BankConnection.Details> {

	private static final int CATEGORY_LENGTH = 60;
	private static final int DESCRIPTION_LENGTH = 300;
	private static final int ERROR_LENGTH = 300;

	private final String externalId;

	private BankConnection(UUID id, UUID ownerId, String externalId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
		this.externalId = externalId;
	}

	public static BankConnection connect(UUID ownerId, String externalId, String institution, EntryScope scope,
			ConnectionStatus status) {
		return new BankConnection(Ids.newId(), ownerId, Require.text(externalId, "externalId", 120),
				new Details(institution, scope, status, null, null, List.of()), true);
	}

	public static BankConnection restore(UUID id, UUID ownerId, String externalId, Details details) {
		return new BankConnection(id, ownerId, externalId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		return new Details(Require.text(d.institution(), "institution", 200), Require.present(d.scope(), "scope"),
				Require.present(d.status(), "status"), d.lastSyncedAt(), d.lastError(), List.copyOf(d.accounts()));
	}

	/**
	 * The entry for a settled bank transaction, positive amount meaning money in. Empty for a zero
	 * amount, which is not a cash movement and that {@link FinanceEntry} refuses. Provider text is
	 * cut to fit instead of failing the whole sync over one long description.
	 */
	public Optional<FinanceEntry> importEntry(String externalTransactionId, LocalDate date, String description,
			BigDecimal signedAmount, String category) {
		BigDecimal amount = Money.scale(signedAmount);
		if (amount.signum() == 0) {
			return Optional.empty();
		}
		EntryKind kind = amount.signum() > 0 ? EntryKind.INCOME : EntryKind.EXPENSE;
		return Optional.of(FinanceEntry.imported(ownerId(),
				new FinanceEntry.Details(kind, details().scope(), fit(category, CATEGORY_LENGTH, "Sem categoria"),
						fit(description, DESCRIPTION_LENGTH, "Sem descrição"), amount.abs(), date, false),
				externalTransactionId));
	}

	public void synced(String institution, ConnectionStatus status, List<BankAccount> accounts, Instant at) {
		update(new Details(institution, details().scope(), status, at, null, accounts));
	}

	/** Keeps what the last good sync knew; only the error is new. */
	public void syncFailed(String error) {
		Details d = details();
		update(new Details(d.institution(), d.scope(), ConnectionStatus.ERROR, d.lastSyncedAt(),
				fit(error, ERROR_LENGTH, "Falha na sincronização"), d.accounts()));
	}

	private static String fit(String text, int length, String fallback) {
		if (text == null || text.isBlank()) {
			return fallback;
		}
		String trimmed = text.strip();
		return trimmed.length() <= length ? trimmed : trimmed.substring(0, length).strip();
	}

	public String externalId() {
		return externalId;
	}

	public record Details(String institution, EntryScope scope, ConnectionStatus status, Instant lastSyncedAt,
			String lastError, List<BankAccount> accounts) {
	}

	public record BankAccount(String externalId, String name, AccountType type, BigDecimal balance, String currency) {
	}

}
