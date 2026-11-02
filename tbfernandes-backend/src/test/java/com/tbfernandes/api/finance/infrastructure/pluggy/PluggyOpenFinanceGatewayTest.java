package com.tbfernandes.api.finance.infrastructure.pluggy;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import com.tbfernandes.api.finance.application.OpenFinanceGateway.ExternalAccount;
import com.tbfernandes.api.finance.application.OpenFinanceGateway.ExternalTransaction;
import com.tbfernandes.api.finance.domain.AccountType;
import com.tbfernandes.api.finance.domain.ConnectionStatus;
import com.tbfernandes.api.shared.domain.ExternalServiceFailure;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** FIN-OF-07: the adapter against Pluggy's documented contract, without calling Pluggy. */
class PluggyOpenFinanceGatewayTest {

	private static final String BASE = "https://pluggy.test";

	private static final ExternalAccount CHECKING = new ExternalAccount("acc", "Conta", AccountType.BANK, BigDecimal.TEN,
			"BRL");

	private static final ExternalAccount CARD = new ExternalAccount("card", "Cartão", AccountType.CREDIT, BigDecimal.TEN,
			"BRL");

	private MockRestServiceServer server;

	private PluggyOpenFinanceGateway gateway;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		gateway = new PluggyOpenFinanceGateway(builder, new PluggyProperties(true, BASE, "id", "secret"),
				Clock.systemUTC());
	}

	private void expectAuth(String key) {
		server.expect(requestTo(BASE + "/auth"))
			.andExpect(method(HttpMethod.POST))
			.andExpect(jsonPath("$.clientId").value("id"))
			.andExpect(jsonPath("$.clientSecret").value("secret"))
			.andRespond(withSuccess("{\"apiKey\": \"" + key + "\"}", MediaType.APPLICATION_JSON));
	}

	private void expectToken(String key) {
		server.expect(requestTo(BASE + "/connect_token"))
			.andExpect(header("X-API-KEY", key))
			.andRespond(withSuccess("{\"accessToken\": \"tok\"}", MediaType.APPLICATION_JSON));
	}

	@Test
	void reusesTheApiKeyAndSendsTheClientUserId() {
		expectAuth("key-1");
		server.expect(requestTo(BASE + "/connect_token"))
			.andExpect(method(HttpMethod.POST))
			.andExpect(header("X-API-KEY", "key-1"))
			.andExpect(jsonPath("$.options.clientUserId").value("me"))
			.andExpect(jsonPath("$.options.avoidDuplicates").value(true))
			.andExpect(jsonPath("$.itemId").doesNotExist())
			.andRespond(withSuccess("{\"accessToken\": \"tok-1\"}", MediaType.APPLICATION_JSON));
		server.expect(requestTo(BASE + "/connect_token"))
			.andExpect(header("X-API-KEY", "key-1"))
			.andExpect(jsonPath("$.itemId").value("item"))
			.andRespond(withSuccess("{\"accessToken\": \"tok-2\"}", MediaType.APPLICATION_JSON));

		assertThat(gateway.createConnectToken("me", null).accessToken()).isEqualTo("tok-1");
		assertThat(gateway.createConnectToken("me", "item").accessToken()).isEqualTo("tok-2");
		server.verify();
	}

	@Test
	void asksForANewKeyOnceWhenTheKeyIsRefused() {
		expectAuth("old");
		server.expect(requestTo(BASE + "/connect_token"))
			.andExpect(header("X-API-KEY", "old"))
			.andRespond(withStatus(HttpStatus.UNAUTHORIZED));
		expectAuth("new");
		expectToken("new");

		assertThat(gateway.createConnectToken("me", null).accessToken()).isEqualTo("tok");
		server.verify();
	}

	@Test
	void providerFailureBecomesExternalServiceFailureWithoutSecrets() {
		expectAuth("key");
		server.expect(requestTo(BASE + "/items/item")).andRespond(withStatus(HttpStatus.BAD_GATEWAY));

		assertThatThrownBy(() -> gateway.getConnection("item")).isInstanceOf(ExternalServiceFailure.class)
			.hasMessageContaining("Pluggy")
			.hasMessageNotContaining("secret");
	}

	@Test
	void mapsItemStatusAndInstitution() {
		expectAuth("key");
		server.expect(requestTo(BASE + "/items/a"))
			.andRespond(withSuccess("""
					{"id": "a", "status": "UPDATED", "connector": {"id": 1, "name": "Nubank"}, "extra": true}""",
					MediaType.APPLICATION_JSON));
		server.expect(requestTo(BASE + "/items/b"))
			.andRespond(withSuccess("""
					{"id": "b", "status": "LOGIN_ERROR", "connector": {"name": "Itaú"}}""",
					MediaType.APPLICATION_JSON));
		server.expect(requestTo(BASE + "/items/c"))
			.andRespond(withSuccess("""
					{"id": "c", "status": "OUTDATED"}""", MediaType.APPLICATION_JSON));

		assertThat(gateway.getConnection("a").institution()).isEqualTo("Nubank");
		assertThat(gateway.getConnection("b").status()).isEqualTo(ConnectionStatus.NEEDS_RECONNECT);
		assertThat(gateway.getConnection("c").status()).isEqualTo(ConnectionStatus.ERROR);
	}

	@Test
	void listsAccounts() {
		expectAuth("key");
		server.expect(requestTo(BASE + "/accounts?itemId=item"))
			.andRespond(withSuccess("""
					{"page": 1, "total": 2, "totalPages": 1, "results": [
					  {"id": "a1", "name": "Conta Corrente", "type": "BANK", "balance": 100.5, "currencyCode": "BRL"},
					  {"id": "a2", "name": "Cartão", "type": "CREDIT", "balance": 20, "currencyCode": "BRL"}
					]}""", MediaType.APPLICATION_JSON));

		List<ExternalAccount> accounts = gateway.listAccounts("item");

		assertThat(accounts).extracting(ExternalAccount::type).containsExactly(AccountType.BANK, AccountType.CREDIT);
		assertThat(accounts.getFirst().balance()).isEqualByComparingTo("100.5");
	}

	@Test
	void followsTheCursorAndLeavesOutPendingTransactions() {
		expectAuth("key");
		server.expect(requestTo(BASE + "/v2/transactions?accountId=acc&dateFrom=2031-01-01&dateTo=2031-03-31"))
			.andRespond(withSuccess("""
					{"results": [
					  {"id": "t1", "date": "2031-03-05T00:00:00.000Z", "description": "Mercado", "amount": -10.5,
					   "currencyCode": "BRL", "type": "DEBIT", "status": "POSTED", "category": "Food"},
					  {"id": "t2", "date": "2031-03-06T00:00:00.000Z", "description": "Agendado", "amount": -5,
					   "currencyCode": "BRL", "type": "DEBIT", "status": "PENDING"}
					], "next": "?accountId=acc&after=abc%3D"}""", MediaType.APPLICATION_JSON));
		server.expect(requestTo(BASE + "/v2/transactions?accountId=acc&after=abc%3D"))
			.andExpect(header("X-API-KEY", "key"))
			.andRespond(withSuccess("""
					{"results": [
					  {"id": "t3", "date": "2031-03-07T00:00:00.000Z", "description": "Pix", "amount": 99,
					   "currencyCode": "BRL", "type": "CREDIT", "status": "POSTED"}
					], "next": null}""", MediaType.APPLICATION_JSON));

		List<ExternalTransaction> transactions = gateway.listTransactions(CHECKING, LocalDate.of(2031, 1, 1),
				LocalDate.of(2031, 3, 31));

		assertThat(transactions).extracting(ExternalTransaction::id).containsExactly("t1", "t3");
		assertThat(transactions.getFirst().date()).isEqualTo(LocalDate.of(2031, 3, 5));
		assertThat(transactions.getFirst().amount()).isEqualByComparingTo("-10.5");
		assertThat(transactions.getLast().amount()).isEqualByComparingTo("99");
		server.verify();
	}

	@Test
	void onACardAPositiveAmountIsMoneyOutAndForeignPurchasesUseTheAccountCurrency() {
		expectAuth("key");
		server.expect(requestTo(BASE + "/v2/transactions?accountId=card&dateFrom=2031-01-01&dateTo=2031-03-31"))
			.andRespond(withSuccess("""
					{"results": [
					  {"id": "c1", "date": "2031-03-05T00:00:00.000Z", "description": "Loja", "amount": 50,
					   "currencyCode": "BRL", "type": "CREDIT", "status": "POSTED"},
					  {"id": "c2", "date": "2031-03-05T00:00:00.000Z", "description": "Pagamento", "amount": -50,
					   "currencyCode": "BRL", "type": "DEBIT", "status": "POSTED"},
					  {"id": "c3", "date": "2031-03-05T00:00:00.000Z", "description": "Amazon US", "amount": 10,
					   "amountInAccountCurrency": 55.3, "currencyCode": "USD", "type": "CREDIT", "status": "POSTED"}
					], "next": null}""", MediaType.APPLICATION_JSON));

		List<ExternalTransaction> transactions = gateway.listTransactions(CARD, LocalDate.of(2031, 1, 1),
				LocalDate.of(2031, 3, 31));

		assertThat(transactions).extracting(t -> t.amount().doubleValue()).containsExactly(-50.0, 50.0, -55.3);
	}

	@Test
	void deletingAConnectionAlreadyGoneIsNotAFailure() {
		expectAuth("key");
		server.expect(requestTo(BASE + "/items/gone"))
			.andExpect(method(HttpMethod.DELETE))
			.andRespond(withStatus(HttpStatus.NOT_FOUND));

		gateway.deleteConnection("gone");
		server.verify();
	}

}
