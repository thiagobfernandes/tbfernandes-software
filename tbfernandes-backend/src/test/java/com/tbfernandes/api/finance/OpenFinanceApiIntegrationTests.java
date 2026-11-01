package com.tbfernandes.api.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.ApiTestSupport;
import com.tbfernandes.api.finance.application.OpenFinanceGateway;
import com.tbfernandes.api.finance.domain.AccountType;
import com.tbfernandes.api.finance.domain.ConnectionStatus;
import com.tbfernandes.api.shared.domain.ExternalServiceFailure;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import static org.assertj.core.api.Assertions.assertThat;

@TestPropertySource(properties = "tbf.pluggy.webhook-secret=s3cret")
@Import(OpenFinanceApiIntegrationTests.FakeGatewayConfig.class)
class OpenFinanceApiIntegrationTests extends ApiTestSupport {

	/** Owner seeded for the single-user mode (application.yaml). */
	private static final String OWNER = "0192f000-0000-7000-8000-000000000001";

	@Autowired
	FakeGateway gateway;

	@BeforeEach
	void reset() {
		gateway.failing = false;
		gateway.status = ConnectionStatus.ACTIVE;
		gateway.transactions.clear();
	}

	private static String uniqueItem() {
		return "item-" + UUID.randomUUID();
	}

	private static String uniqueTx() {
		return "tx-" + UUID.randomUUID();
	}

	private MvcTestResult webhook(String secret, String json) {
		var request = mvc.post().uri("/api/v1/webhooks/pluggy").contentType(MediaType.APPLICATION_JSON).content(json);
		return (secret == null ? request : request.header("X-Webhook-Secret", secret)).exchange();
	}

	private OpenFinanceGateway.ExternalTransaction expense(String id, String date) {
		return new OpenFinanceGateway.ExternalTransaction(id, "acc", LocalDate.parse(date), "Mercado",
				new BigDecimal("-25.00"), "BRL", "Food");
	}

	private List<String> imported(String month, String scope) {
		return read(get("/api/v1/finance/entries?month=" + month + "&scope=" + scope), "$[*].description");
	}

	private String connectionField(String itemId, String field) {
		List<String> ids = read(get("/api/v1/finance/connections"), "$[*].id");
		for (String id : ids) {
			if (id.equals(idOf(itemId))) {
				List<Object> value = read(get("/api/v1/finance/connections"),
						"$[?(@.id == '" + id + "')]." + field);
				return String.valueOf(value.getFirst());
			}
		}
		throw new AssertionError("connection not found: " + itemId);
	}

	private String idOf(String itemId) {
		return gateway.registeredIds.get(itemId);
	}

	private String register(String itemId, String scope) {
		String id = create("/api/v1/finance/connections", """
				{"itemId": "%s", "scope": "%s"}""".formatted(itemId, scope));
		gateway.registeredIds.put(itemId, id);
		return id;
	}

	@Test
	void availabilityFollowsTheGateway() {
		assertThat((Boolean) read(get("/api/v1/finance/connections/availability"), "$.enabled")).isTrue();
	}

	@Test
	void tokenCarriesTheOwnerAndTheChosenScope() {
		var result = post("/api/v1/finance/connections/token", """
				{"scope": "business"}""");
		assertThat(result).hasStatusOk();
		assertThat((String) read(result, "$.accessToken")).isEqualTo("token-for-" + OWNER + ":BUSINESS");
		assertThat(post("/api/v1/finance/connections/token", "{}")).hasStatus(400);
	}

	@Test
	void registeringImportsInTheChosenScopeWithoutDuplicates() {
		gateway.transactions.add(expense(uniqueTx(), "2031-05-10"));
		String item = uniqueItem();

		String id = register(item, "business");

		eventually(() -> imported("2031-05", "business").contains("Mercado"));
		assertThat(imported("2031-05", "personal")).doesNotContain("Mercado");
		assertThat(connectionField(item, "institution")).isEqualTo("Banco Teste");
		assertThat(connectionField(item, "accounts[0].name")).isEqualTo("Conta");

		// A manual sync after the automatic one finds nothing new (RN-16).
		var sync = post("/api/v1/finance/connections/" + id + "/sync", "");
		assertThat(sync).hasStatusOk();
		assertThat((Integer) read(sync, "$.imported")).isZero();
		assertThat(imported("2031-05", "business")).hasSize(1);

		// New data arrives: the next sync brings only that.
		gateway.transactions.add(expense(uniqueTx(), "2031-05-11"));
		assertThat((Integer) read(post("/api/v1/finance/connections/" + id + "/sync", ""), "$.imported")).isEqualTo(1);
	}

	@Test
	void registeringTwiceReturnsTheSameConnection() {
		String item = uniqueItem();
		String first = register(item, "personal");
		String second = register(item, "personal");
		assertThat(second).isEqualTo(first);
	}

	@Test
	void aProviderFailureIsReportedOnTheConnection() {
		String item = uniqueItem();
		String id = register(item, "personal");
		eventually(() -> !"null".equals(connectionField(item, "lastSyncedAt")));

		gateway.failing = true;
		var sync = post("/api/v1/finance/connections/" + id + "/sync", "");

		assertThat(sync).hasStatusOk();
		assertThat((String) read(sync, "$.connection.status")).isEqualTo("error");
		assertThat((String) read(sync, "$.connection.lastError")).contains("fora do ar");

		gateway.failing = false;
		assertThat((String) read(post("/api/v1/finance/connections/" + id + "/sync", ""), "$.connection.status"))
			.isEqualTo("active");
	}

	@Test
	void aBankAskingForLoginShowsAsNeedingReconnect() {
		String id = register(uniqueItem(), "personal");
		gateway.status = ConnectionStatus.NEEDS_RECONNECT;

		eventually(() -> "needs_reconnect"
			.equals(read(post("/api/v1/finance/connections/" + id + "/sync", ""), "$.connection.status")));
	}

	@Test
	void webhookNeedsTheSecret() {
		String body = """
				{"event": "item/updated", "itemId": "x"}""";
		assertThat(webhook(null, body)).hasStatus(401);
		assertThat(webhook("wrong", body)).hasStatus(401);
		assertThat(webhook("s3cret", body)).hasStatus(204);
	}

	@Test
	void webhookAloneRegistersANewConnectionWithTheScopeFromTheToken() {
		gateway.transactions.add(expense(uniqueTx(), "2031-06-10"));
		String item = uniqueItem();

		assertThat(webhook("s3cret", """
				{"event": "item/updated", "itemId": "%s", "clientUserId": "%s:BUSINESS"}""".formatted(item, OWNER)))
			.hasStatus(204);

		eventually(() -> imported("2031-06", "business").contains("Mercado"));
		// The widget's callback arriving after the webhook finds the same connection.
		assertThat(register(item, "business")).isNotNull();
		List<String> ids = read(get("/api/v1/finance/connections"), "$[?(@.institution == 'Banco Teste')].id");
		assertThat(ids).doesNotHaveDuplicates();
	}

	@Test
	void webhookForAnUnknownConnectionWithoutAValidClaimIsIgnored() {
		int before = ((List<?>) read(get("/api/v1/finance/connections"), "$")).size();
		assertThat(webhook("s3cret", """
				{"event": "item/updated", "itemId": "%s", "clientUserId": "someone"}""".formatted(uniqueItem())))
			.hasStatus(204);
		assertThat(webhook("s3cret", """
				{"event": "some/other", "itemId": "x"}""")).hasStatus(204);
		assertThat(((List<?>) read(get("/api/v1/finance/connections"), "$")).size()).isEqualTo(before);
	}

	@Test
	void transactionsDeletedAtTheProviderLeaveTheCashFlow() {
		String tx = uniqueTx();
		gateway.transactions.add(expense(tx, "2031-07-10"));
		String item = uniqueItem();
		register(item, "personal");
		eventually(() -> imported("2031-07", "personal").contains("Mercado"));

		assertThat(webhook("s3cret", """
				{"event": "transactions/deleted", "itemId": "%s", "transactionIds": ["%s"]}""".formatted(item, tx)))
			.hasStatus(204);

		assertThat(imported("2031-07", "personal")).doesNotContain("Mercado");
	}

	@Test
	void disconnectingKeepsImportedEntriesAndRevokesAtTheProvider() {
		gateway.transactions.add(expense(uniqueTx(), "2031-08-10"));
		String item = uniqueItem();
		String id = register(item, "personal");
		eventually(() -> imported("2031-08", "personal").contains("Mercado"));

		assertThat(mvc.delete().uri("/api/v1/finance/connections/" + id)).hasStatus(204);

		assertThat(gateway.deleted).contains(item);
		assertThat(mvc.post().uri("/api/v1/finance/connections/" + id + "/sync")).hasStatus(404);
		assertThat(imported("2031-08", "personal")).contains("Mercado");
	}

	@Test
	void itemDeletedAtTheProviderRemovesTheConnection() {
		String item = uniqueItem();
		String id = register(item, "personal");

		assertThat(webhook("s3cret", """
				{"event": "item/deleted", "itemId": "%s"}""".formatted(item))).hasStatus(204);

		assertThat(mvc.post().uri("/api/v1/finance/connections/" + id + "/sync")).hasStatus(404);
	}

	@Test
	void reconnectTokenPointsAtTheExistingItem() {
		String item = uniqueItem();
		String id = register(item, "business");

		var result = post("/api/v1/finance/connections/" + id + "/token", "");

		assertThat(result).hasStatusOk();
		assertThat((String) read(result, "$.itemId")).isEqualTo(item);
		assertThat((String) read(result, "$.accessToken")).isEqualTo("token-for-" + OWNER + ":BUSINESS");
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class FakeGatewayConfig {

		@Bean
		@Primary
		FakeGateway fakeGateway() {
			return new FakeGateway();
		}

	}

	static class FakeGateway implements OpenFinanceGateway {

		final List<ExternalTransaction> transactions = new java.util.concurrent.CopyOnWriteArrayList<>();

		final List<String> deleted = new ArrayList<>();

		final java.util.Map<String, String> registeredIds = new java.util.concurrent.ConcurrentHashMap<>();

		volatile boolean failing;

		volatile ConnectionStatus status = ConnectionStatus.ACTIVE;

		@Override
		public boolean enabled() {
			return true;
		}

		@Override
		public ConnectToken createConnectToken(String clientUserId, String connectionId) {
			return new ConnectToken("token-for-" + clientUserId);
		}

		@Override
		public ExternalConnection getConnection(String connectionId) {
			failIfAsked();
			return new ExternalConnection(connectionId, "Banco Teste", status);
		}

		@Override
		public List<ExternalAccount> listAccounts(String connectionId) {
			failIfAsked();
			return List.of(new ExternalAccount("acc", "Conta", AccountType.BANK, BigDecimal.TEN, "BRL"));
		}

		@Override
		public List<ExternalTransaction> listTransactions(ExternalAccount account, LocalDate from, LocalDate to) {
			failIfAsked();
			return List.copyOf(transactions);
		}

		@Override
		public void deleteConnection(String connectionId) {
			deleted.add(connectionId);
		}

		private void failIfAsked() {
			if (failing) {
				throw new ExternalServiceFailure("Pluggy fora do ar", null);
			}
		}

	}

}
