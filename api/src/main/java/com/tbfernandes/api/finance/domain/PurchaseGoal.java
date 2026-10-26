package com.tbfernandes.api.finance.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** Something to buy and the money set aside for it (RF-FIN-03). */
public final class PurchaseGoal extends Aggregate<PurchaseGoal.Details> {

	private PurchaseGoal(UUID id, UUID ownerId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static PurchaseGoal create(UUID ownerId, Details details) {
		return new PurchaseGoal(Ids.forNewAggregate(), ownerId, details, true);
	}

	public static PurchaseGoal restore(UUID id, UUID ownerId, Details details) {
		return new PurchaseGoal(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		BigDecimal reserved = d.reserved() == null ? BigDecimal.ZERO : Money.scale(d.reserved());
		if (reserved.signum() < 0) {
			throw new BusinessRuleViolation("RN-18", "Reserved money cannot be negative");
		}
		PurchaseStatus status = d.status() == null ? PurchaseStatus.PLANNED : d.status();
		if (status == PurchaseStatus.BOUGHT && d.paid() == null) {
			throw new BusinessRuleViolation("RN-17", "A bought purchase needs the amount paid");
		}
		return new Details(Require.text(d.name(), "name", 200), Require.optionalText(d.description(), "description", 2000),
				Money.positive(d.estimated(), "estimated"), reserved,
				Money.optionalPositive(d.monthlySaving(), "monthlySaving"),
				d.priority() == null ? PurchasePriority.NORMAL : d.priority(), d.desiredDate(), d.goalId(), status,
				Money.optionalPositive(d.paid(), "paid"));
	}

	/**
	 * FIN-04: when the purchase becomes affordable at the planned monthly saving, and whether
	 * that meets the desired date. Same rule as web/src/features/finance/lib/projection.ts.
	 */
	public Projection project(LocalDate today) {
		Details d = details();
		BigDecimal missing = d.estimated().subtract(d.reserved()).max(BigDecimal.ZERO);
		if (missing.signum() == 0) {
			return new Projection(missing, true, null, null, null);
		}
		if (d.monthlySaving() == null) {
			return new Projection(missing, false, null, null, null);
		}
		int months = missing.divide(d.monthlySaving(), 0, RoundingMode.CEILING).intValueExact();
		YearMonth month = YearMonth.from(today).plusMonths(months);
		Boolean onTime = d.desiredDate() == null ? null : !month.isAfter(YearMonth.from(d.desiredDate()));
		return new Projection(missing, false, months, month, onTime);
	}

	public record Details(String name, String description, BigDecimal estimated, BigDecimal reserved,
			BigDecimal monthlySaving, PurchasePriority priority, LocalDate desiredDate, UUID goalId,
			PurchaseStatus status, BigDecimal paid) {
	}

	public record Projection(BigDecimal missing, boolean ready, Integer months, YearMonth month, Boolean onTime) {
	}

}
