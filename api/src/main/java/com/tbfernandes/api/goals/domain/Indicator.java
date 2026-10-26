package com.tbfernandes.api.goals.domain;

import java.math.BigDecimal;

import com.tbfernandes.api.shared.domain.Require;

/** Measurable indicator, e.g. "Saved for the down payment: 6000 / 20000 BRL". */
public record Indicator(String label, BigDecimal current, BigDecimal target, String unit) {

	public Indicator {
		label = Require.text(label, "indicator label", 120);
		current = current == null ? BigDecimal.ZERO : current;
		target = Require.present(target, "indicator target");
		if (target.signum() <= 0) {
			throw new IllegalArgumentException("indicator target must be positive");
		}
		unit = Require.text(unit, "indicator unit", 20);
	}

	public Indicator withCurrent(BigDecimal value) {
		return new Indicator(label, value, target, unit);
	}

	/** Progress from 0 to 100, capped (the current value may pass the target). */
	public int percent() {
		return current.multiply(BigDecimal.valueOf(100)).divide(target, 0, java.math.RoundingMode.DOWN).min(
				BigDecimal.valueOf(100)).max(BigDecimal.ZERO).intValue();
	}

}
