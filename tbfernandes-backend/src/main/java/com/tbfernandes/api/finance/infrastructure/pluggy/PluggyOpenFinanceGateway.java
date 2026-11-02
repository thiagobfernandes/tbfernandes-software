package com.tbfernandes.api.finance.infrastructure.pluggy;

import java.math.BigDecimal;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import com.tbfernandes.api.finance.application.OpenFinanceGateway;
import com.tbfernandes.api.finance.domain.AccountType;
import com.tbfernandes.api.finance.domain.ConnectionStatus;
import com.tbfernandes.api.shared.domain.ExternalServiceFailure;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Pluggy adapter, active with tbf.pluggy.enabled=true. Contract: https://docs.pluggy.ai
 * <ul>
 * <li>POST /auth returns an API key valid for 2 hours, reused because /auth is rate limited;</li>
 * <li>POST /connect_token returns the token for the Pluggy Connect widget;</li>
 * <li>GET /items/{id}, GET /accounts?itemId=..., DELETE /items/{id};</li>
 * <li>GET /v2/transactions is paged by cursor ("next"); the page-numbered GET /transactions is
 * removed after 2026-12-31.</li>
 * </ul>
 */
@Component
@ConditionalOnProperty(prefix = "tbf.pluggy", name = "enabled", havingValue = "true")
class PluggyOpenFinanceGateway implements OpenFinanceGateway {

	private static final Logger log = LoggerFactory.getLogger(PluggyOpenFinanceGateway.class);

	/** Renews before the 2 hours end, so a key never expires in the middle of a sync. */
	private static final Duration API_KEY_LIFETIME = Duration.ofMinutes(110);

	private final RestClient http;
	private final PluggyProperties properties;
	private final Clock clock;

	private String apiKey;
	private Instant apiKeyExpiresAt = Instant.MIN;

	PluggyOpenFinanceGateway(RestClient.Builder builder, PluggyProperties properties, Clock clock) {
		if (!StringUtils.hasText(properties.clientId()) || !StringUtils.hasText(properties.clientSecret())) {
			throw new IllegalStateException("tbf.pluggy.enabled=true needs PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET");
		}
		this.http = builder.baseUrl(properties.baseUrl()).build();
		this.properties = properties;
		this.clock = clock;
	}

	@Override
	public boolean enabled() {
		return true;
	}

	@Override
	public ConnectToken createConnectToken(String clientUserId, String connectionId) {
		Map<String, Object> body = new HashMap<>();
		// avoidDuplicates: logging in to the same bank twice must not create a second item.
		body.put("options", Map.of("clientUserId", clientUserId, "avoidDuplicates", true));
		if (connectionId != null) {
			body.put("itemId", connectionId);
		}
		return call(key -> http.post()
			.uri("/connect_token")
			.header("X-API-KEY", key)
			.contentType(MediaType.APPLICATION_JSON)
			.body(body)
			.retrieve()
			.body(ConnectToken.class));
	}

	@Override
	public ExternalConnection getConnection(String connectionId) {
		ItemResponse item = call(key -> http.get()
			.uri("/items/{id}", connectionId)
			.header("X-API-KEY", key)
			.retrieve()
			.body(ItemResponse.class));
		return new ExternalConnection(item.id(), item.connector() == null ? "Banco" : item.connector().name(),
				status(item.status()));
	}

	@Override
	public List<ExternalAccount> listAccounts(String connectionId) {
		AccountsResponse response = call(key -> http.get()
			.uri(uri -> uri.path("/accounts").queryParam("itemId", connectionId).build())
			.header("X-API-KEY", key)
			.retrieve()
			.body(AccountsResponse.class));
		return response.results()
			.stream()
			.map(a -> new ExternalAccount(a.id(), a.name(), AccountType.valueOf(a.type()), a.balance(),
					a.currencyCode()))
			.toList();
	}

	@Override
	public List<ExternalTransaction> listTransactions(ExternalAccount account, LocalDate from, LocalDate to) {
		List<ExternalTransaction> transactions = new ArrayList<>();
		TransactionsResponse page = call(key -> http.get()
			.uri(uri -> uri.path("/v2/transactions")
				.queryParam("accountId", account.id())
				.queryParam("dateFrom", from)
				.queryParam("dateTo", to)
				.build())
			.header("X-API-KEY", key)
			.retrieve()
			.body(TransactionsResponse.class));
		while (true) {
			page.results()
				.stream()
				.filter(t -> !"PENDING".equals(t.status()))
				.map(t -> toTransaction(account, t))
				.forEach(transactions::add);
			if (page.next() == null) {
				return transactions;
			}
			// "next" is the ready-to-use query string, so it must not be encoded again.
			URI next = URI.create(properties.baseUrl() + "/v2/transactions" + page.next());
			page = call(key -> http.get()
				.uri(next)
				.header("X-API-KEY", key)
				.retrieve()
				.body(TransactionsResponse.class));
		}
	}

	@Override
	public void deleteConnection(String connectionId) {
		try {
			call(key -> http.delete()
				.uri("/items/{id}", connectionId)
				.header("X-API-KEY", key)
				.retrieve()
				.toBodilessEntity());
		}
		catch (ExternalServiceFailure ex) {
			if (!(ex.getCause() instanceof HttpClientErrorException.NotFound)) {
				throw ex;
			}
		}
	}

	private static ExternalTransaction toTransaction(ExternalAccount account, TransactionResponse t) {
		BigDecimal value = t.amountInAccountCurrency() != null ? t.amountInAccountCurrency() : t.amount();
		return new ExternalTransaction(t.id(), account.id(), LocalDate.ofInstant(Instant.parse(t.date()), ZoneOffset.UTC),
				t.description(), moneyOut(account, t) ? value.abs().negate() : value.abs(), t.currencyCode(),
				t.category());
	}

	/** On a card a positive amount is a new charge and a negative one a payment; on a bank account "type" tells. */
	private static boolean moneyOut(ExternalAccount account, TransactionResponse t) {
		return account.type() == AccountType.CREDIT ? t.amount().signum() > 0 : "DEBIT".equals(t.type());
	}

	private static ConnectionStatus status(String itemStatus) {
		return switch (itemStatus) {
			case "UPDATED", "UPDATING" -> ConnectionStatus.ACTIVE;
			case "LOGIN_ERROR", "WAITING_USER_INPUT", "WAITING_USER_ACTION" -> ConnectionStatus.NEEDS_RECONNECT;
			default -> ConnectionStatus.ERROR;
		};
	}

	/** Runs a request with the current key and, if Pluggy refuses it, once more with a new one. */
	private <T> T call(Function<String, T> request) {
		try {
			try {
				return request.apply(apiKey(false));
			}
			catch (HttpClientErrorException.Unauthorized ex) {
				return request.apply(apiKey(true));
			}
		}
		catch (RestClientException ex) {
			log.warn("Pluggy request failed: {}", ex.getMessage());
			throw new ExternalServiceFailure("Não foi possível falar com a Pluggy; tente de novo em instantes", ex);
		}
	}

	private synchronized String apiKey(boolean renew) {
		Instant now = clock.instant();
		if (renew || now.isAfter(apiKeyExpiresAt)) {
			AuthResponse auth = http.post()
				.uri("/auth")
				.contentType(MediaType.APPLICATION_JSON)
				.body(Map.of("clientId", properties.clientId(), "clientSecret", properties.clientSecret()))
				.retrieve()
				.body(AuthResponse.class);
			apiKey = auth.apiKey();
			apiKeyExpiresAt = now.plus(API_KEY_LIFETIME);
		}
		return apiKey;
	}

	private record AuthResponse(String apiKey) {
	}

	private record ItemResponse(String id, String status, Connector connector) {

		private record Connector(String name) {
		}

	}

	private record AccountsResponse(List<AccountResponse> results) {
	}

	private record AccountResponse(String id, String name, String type, BigDecimal balance, String currencyCode) {
	}

	private record TransactionsResponse(List<TransactionResponse> results, String next) {
	}

	private record TransactionResponse(String id, String date, String description, BigDecimal amount,
			BigDecimal amountInAccountCurrency, String currencyCode, String type, String status, String category) {
	}

}
