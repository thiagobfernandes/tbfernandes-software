package com.tbfernandes.api.finance;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/** Read access to finance data for other modules (goals, assistant). */
public interface FinanceLookup {

	List<PurchaseView> purchases(UUID ownerId);

	MonthView month(UUID ownerId, YearMonth month);

	record PurchaseView(UUID id, String name, String status, UUID goalId, BigDecimal estimated,
			BigDecimal reserved) {
	}

	/** Personal scope only: business revenue is not personal income (RN-12). */
	record MonthView(YearMonth month, BigDecimal personalIncome, BigDecimal personalExpense) {
	}

}
