package com.tbfernandes.api.finance.adapter.out.pluggy;

import java.time.LocalDate;
import java.util.List;

import com.tbfernandes.api.finance.application.port.out.OpenFinanceGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Pluggy adapter, not implemented yet (backlog FIN-OF-02..05). Active only with
 * tbf.pluggy.enabled=true.
 * <p>
 * Planned calls, to confirm against https://docs.pluggy.ai when implementing:
 * <ul>
 * <li>POST /auth with clientId/clientSecret returns an API key, cached until it expires;</li>
 * <li>POST /connect_token returns the token for the Pluggy Connect widget;</li>
 * <li>GET /accounts?itemId=... lists the accounts of a connection;</li>
 * <li>GET /transactions?accountId=...&from=...&to=... is paginated;</li>
 * <li>webhooks (item/updated) trigger the incremental sync.</li>
 * </ul>
 */
@Component
@ConditionalOnProperty(prefix = "tbf.pluggy", name = "enabled", havingValue = "true")
class PluggyOpenFinanceGateway implements OpenFinanceGateway {

	private final RestClient http;

	PluggyOpenFinanceGateway(RestClient.Builder builder, PluggyProperties properties) {
		this.http = builder.baseUrl(properties.baseUrl()).build();
	}

	@Override
	public ConnectToken createConnectToken(String clientUserId) {
		throw notImplemented();
	}

	@Override
	public List<ExternalAccount> listAccounts(String connectionId) {
		throw notImplemented();
	}

	@Override
	public List<ExternalTransaction> listTransactions(String accountId, LocalDate from, LocalDate to) {
		throw notImplemented();
	}

	private static UnsupportedOperationException notImplemented() {
		return new UnsupportedOperationException("Pluggy integration is planned in backlog epic FIN-OF");
	}

}
