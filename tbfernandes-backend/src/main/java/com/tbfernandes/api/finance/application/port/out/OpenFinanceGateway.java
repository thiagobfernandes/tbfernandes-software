package com.tbfernandes.api.finance.application.port.out;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.tbfernandes.api.finance.domain.AccountType;
import com.tbfernandes.api.finance.domain.ConnectionStatus;

/**
 * Output port to an open finance aggregator (Pluggy first). The application layer depends
 * only on this interface, so the provider can change without touching use cases.
 * Calls throw {@link com.tbfernandes.api.shared.domain.ExternalServiceFailure} when the provider fails.
 */
public interface OpenFinanceGateway {

	/** False for the disabled adapter (RN-15). */
	boolean enabled();

	/**
	 * Short-lived token the frontend passes to the provider's connect widget.
	 * @param clientUserId comes back in the provider's webhooks
	 * @param connectionId the connection to log in again, or null for a new one
	 */
	ConnectToken createConnectToken(String clientUserId, String connectionId);

	ExternalConnection getConnection(String connectionId);

	/** Accounts of one connection (Pluggy calls a connection an "item"). */
	List<ExternalAccount> listAccounts(String connectionId);

	/** Settled transactions of one account, both dates inclusive. */
	List<ExternalTransaction> listTransactions(ExternalAccount account, LocalDate from, LocalDate to);

	/** Revokes the connection at the provider. A connection already gone is not a failure. */
	void deleteConnection(String connectionId);

	record ConnectToken(String accessToken) {
	}

	record ExternalConnection(String id, String institution, ConnectionStatus status) {
	}

	record ExternalAccount(String id, String name, AccountType type, BigDecimal balance, String currency) {
	}

	/** amount is signed for cash flow, whatever the provider's convention: negative means money out. */
	record ExternalTransaction(String id, String accountId, LocalDate date, String description, BigDecimal amount,
			String currency, String category) {
	}

}
