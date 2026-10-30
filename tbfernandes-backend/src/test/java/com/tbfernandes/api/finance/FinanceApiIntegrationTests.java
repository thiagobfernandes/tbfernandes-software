package com.tbfernandes.api.finance;

import java.util.List;

import com.tbfernandes.api.ApiTestSupport;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FinanceApiIntegrationTests extends ApiTestSupport {

	private void entry(String kind, String scope, String category, String amount, String date) {
		create("/api/v1/finance/entries", """
				{"kind": "%s", "scope": "%s", "category": "%s", "description": "test", "amount": %s, "date": "%s"}"""
			.formatted(kind, scope, category, amount, date));
	}

	private static double number(Object value) {
		return ((Number) value).doubleValue();
	}

	@Test
	void cashFlowSeparatesScopesAndGroupsExpenses() {
		entry("income", "business", "Invoices", "10000", "2031-03-05");
		entry("income", "personal", "Pro-labore", "6000", "2031-03-06");
		entry("expense", "personal", "Rent", "2500", "2031-03-10");
		entry("expense", "personal", "Food", "900.50", "2031-03-12");
		entry("expense", "personal", "Food", "100", "2031-02-12");

		var personal = get("/api/v1/finance/cash-flow?month=2031-03&months=2&scope=personal");
		assertThat(number(read(personal, "$.totals.income"))).isEqualTo(6000.0);
		assertThat(number(read(personal, "$.totals.expense"))).isEqualTo(3400.5);
		assertThat(number(read(personal, "$.series[0].expense"))).isEqualTo(100.0);
		List<String> categories = read(personal, "$.expensesByCategory[*].category");
		assertThat(categories).containsExactly("Rent", "Food");

		var all = get("/api/v1/finance/cash-flow?month=2031-03&months=1");
		assertThat(number(read(all, "$.totals.income"))).isEqualTo(16000.0);
		List<String> marchEntries = read(get("/api/v1/finance/entries?month=2031-03&scope=business"), "$[*].category");
		assertThat(marchEntries).containsExactly("Invoices");
	}

	@Test
	void amountsMustBePositive() {
		assertThat(post("/api/v1/finance/entries", """
				{"kind": "expense", "scope": "personal", "category": "x", "description": "x", "amount": -5,
				 "date": "2031-01-01"}""")).hasStatus(400);
	}

	@Test
	void purchaseRulesProjectionAndGoalLink() {
		String goalId = create("/api/v1/goals", """
				{"name": "Home office", "area": "finance", "desiredResult": "Desk bought"}""");
		String id = create("/api/v1/finance/purchases", """
				{"name": "Desk", "estimated": 3000, "reserved": 1000, "monthlySaving": 600, "goalId": "%s"}"""
			.formatted(goalId));

		var projection = get("/api/v1/finance/purchases/{id}/projection", id);
		assertThat(number(read(projection, "$.missing"))).isEqualTo(2000.0);
		assertThat((Integer) read(projection, "$.months")).isEqualTo(4);

		assertThat(put("/api/v1/finance/purchases/" + id, """
				{"name": "Desk", "estimated": 3000, "status": "bought"}""")).hasStatus(422)
			.bodyJson()
			.hasPathSatisfying("$.rule", rule -> assertThat(rule).isEqualTo("RN-17"));

		List<String> linked = read(get("/api/v1/goals/{id}/links", goalId), "$.purchases[*].id");
		assertThat(linked).containsExactly(id);
	}

}
