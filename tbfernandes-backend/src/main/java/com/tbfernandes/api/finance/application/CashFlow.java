package com.tbfernandes.api.finance.application;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/** FIN-02: the selected month plus the months before it, as the cash flow screen shows. */
public record CashFlow(YearMonth month, String scope, MonthTotals totals, List<MonthTotals> series,
		List<CategoryTotal> expensesByCategory) {

	public record MonthTotals(YearMonth month, BigDecimal income, BigDecimal expense, BigDecimal balance) {
	}

	public record CategoryTotal(String category, BigDecimal amount) {
	}

}
