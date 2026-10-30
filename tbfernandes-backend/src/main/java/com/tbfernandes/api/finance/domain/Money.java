package com.tbfernandes.api.finance.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** BRL amounts with two decimals (RNF-API-03). */
public final class Money {

	private Money() {
	}

	public static BigDecimal positive(BigDecimal value, String field) {
		if (value == null || value.signum() <= 0) {
			throw new IllegalArgumentException(field + " must be greater than zero");
		}
		return scale(value);
	}

	public static BigDecimal optionalPositive(BigDecimal value, String field) {
		return value == null ? null : positive(value, field);
	}

	public static BigDecimal scale(BigDecimal value) {
		return value.setScale(2, RoundingMode.HALF_EVEN);
	}

}
