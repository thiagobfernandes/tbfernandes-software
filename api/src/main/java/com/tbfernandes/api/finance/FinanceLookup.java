package com.tbfernandes.api.finance;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/** Read access to finance data for other modules (goals, assistant). */
public interface FinanceLookup {

	List<PurchaseView> purchases(UUID ownerId);

	MonthView month(UUID ownerId, YearMonth month);

	/**
	 * A purchase goal with its FIN-04 projection: money still missing, whether it is fully
	 * reserved, and in how many months it becomes affordable (null without a monthly saving).
	 */
	record PurchaseView(UUID id, String name, String status, UUID goalId, BigDecimal estimated,
			BigDecimal reserved, BigDecimal missing, boolean ready, Integer months, Boolean onTime) {
	}

	/** Totals per scope. They are never added together: business revenue is not personal income (RN-12). */
	record MonthView(YearMonth month, BigDecimal personalIncome, BigDecimal personalExpense,
			BigDecimal businessIncome, BigDecimal businessExpense) {
	}

}
