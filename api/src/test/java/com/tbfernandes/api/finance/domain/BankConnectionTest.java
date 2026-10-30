package com.tbfernandes.api.finance.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BankConnectionTest {

	private static final LocalDate DAY = LocalDate.of(2031, 3, 5);

	private final BankConnection business = BankConnection.connect(UUID.randomUUID(), "item-1", "Nubank",
			EntryScope.BUSINESS, ConnectionStatus.ACTIVE);

	@Test
	void importedEntryTakesTheScopeOfTheConnectionAndItsDirectionFromTheSign() {
		FinanceEntry expense = business.importEntry("t1", DAY, "Mercado", new BigDecimal("-10.50"), "Food").orElseThrow();
		assertThat(expense.details().kind()).isEqualTo(EntryKind.EXPENSE);
		assertThat(expense.details().amount()).isEqualByComparingTo("10.50");
		assertThat(expense.details().scope()).isEqualTo(EntryScope.BUSINESS);
		assertThat(expense.source()).isEqualTo(EntrySource.OPEN_FINANCE);
		assertThat(expense.externalId()).isEqualTo("t1");

		FinanceEntry income = business.importEntry("t2", DAY, "Pix", new BigDecimal("99"), "Transfer").orElseThrow();
		assertThat(income.details().kind()).isEqualTo(EntryKind.INCOME);
	}

	@Test
	void aZeroAmountIsNotImported() {
		assertThat(business.importEntry("t1", DAY, "Estorno", new BigDecimal("0.001"), "x")).isEmpty();
	}

	@Test
	void providerTextIsCutOrFilledInsteadOfFailingTheSync() {
		FinanceEntry entry = business.importEntry("t1", DAY, "d".repeat(400), BigDecimal.ONE, null).orElseThrow();
		assertThat(entry.details().description()).hasSize(300);
		assertThat(entry.details().category()).isEqualTo("Sem categoria");
		assertThat(business.importEntry("t2", DAY, " ", BigDecimal.ONE, "c".repeat(80)).orElseThrow().details())
			.satisfies(d -> {
				assertThat(d.description()).isEqualTo("Sem descrição");
				assertThat(d.category()).hasSize(60);
			});
	}

	@Test
	void aFailedSyncKeepsWhatTheLastGoodOneKnew() {
		Instant at = Instant.parse("2031-03-05T10:00:00Z");
		List<BankConnection.BankAccount> accounts = List
			.of(new BankConnection.BankAccount("a1", "Conta", AccountType.BANK, BigDecimal.TEN, "BRL"));
		business.synced("Nubank", ConnectionStatus.ACTIVE, accounts, at);

		business.syncFailed("Pluggy fora do ar");

		assertThat(business.details().status()).isEqualTo(ConnectionStatus.ERROR);
		assertThat(business.details().lastError()).isEqualTo("Pluggy fora do ar");
		assertThat(business.details().lastSyncedAt()).isEqualTo(at);
		assertThat(business.details().accounts()).isEqualTo(accounts);

		business.synced("Nubank", ConnectionStatus.ACTIVE, accounts, at.plusSeconds(60));
		assertThat(business.details().lastError()).isNull();
	}

}
