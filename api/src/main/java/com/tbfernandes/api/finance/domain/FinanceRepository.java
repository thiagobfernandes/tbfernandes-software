package com.tbfernandes.api.finance.domain;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port for entries and purchase goals. */
public interface FinanceRepository {

	FinanceEntry save(FinanceEntry entry);

	Optional<FinanceEntry> findEntry(UUID ownerId, UUID id);

	/** Both dates inclusive; scope optional. Newest first. */
	List<FinanceEntry> findEntries(UUID ownerId, LocalDate from, LocalDate to, EntryScope scope);

	boolean existsExternal(UUID ownerId, String externalId);

	void delete(FinanceEntry entry);

	PurchaseGoal save(PurchaseGoal purchase);

	Optional<PurchaseGoal> findPurchase(UUID ownerId, UUID id);

	List<PurchaseGoal> findPurchases(UUID ownerId);

	void delete(PurchaseGoal purchase);

}
