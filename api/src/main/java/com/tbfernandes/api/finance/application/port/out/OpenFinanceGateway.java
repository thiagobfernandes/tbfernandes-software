package com.tbfernandes.api.finance.application.port.out;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Output port to an open finance aggregator (Pluggy first). The application layer depends
 * only on this interface, so the provider can change without touching use cases.
 * <p>
 * Open on purpose: the sync use case, its tables and the adapter are backlog epic FIN-OF.
 */
public interface OpenFinanceGateway {

	/** Short-lived token the frontend passes to the provider's connect widget. */
	ConnectToken createConnectToken(String clientUserId);

	/** Accounts of one connection (Pluggy calls a connection an "item"). */
	List<ExternalAccount> listAccounts(String connectionId);

	/** Transactions of one account, both dates inclusive. */
	List<ExternalTransaction> listTransactions(String accountId, LocalDate from, LocalDate to);

	record ConnectToken(String accessToken) {
	}

	record ExternalAccount(String id, String name, String type, BigDecimal balance, String currency) {
	}

	/** amount is signed as the provider sends it: negative means money out. */
	record ExternalTransaction(String id, String accountId, LocalDate date, String description, BigDecimal amount,
			String currency, String category) {
	}

}
