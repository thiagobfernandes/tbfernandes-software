package com.tbfernandes.api.finance.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port for bank connections. */
public interface BankConnectionRepository {

	BankConnection save(BankConnection connection);

	/**
	 * Stores the connection unless its external id is already taken, and returns the one stored.
	 * The widget callback and the webhook arrive together, so both must be able to register it.
	 */
	BankConnection saveIfAbsent(BankConnection connection);

	Optional<BankConnection> find(UUID ownerId, UUID id);

	/** Webhooks only carry the provider's id, so this one is not scoped by owner. */
	Optional<BankConnection> findByExternalId(String externalId);

	/** Holds the row until the transaction ends, so two syncs of one connection run in turn. */
	Optional<BankConnection> lockByExternalId(String externalId);

	List<BankConnection> findAll(UUID ownerId);

	void delete(BankConnection connection);

}
