package com.tbfernandes.api.shared.domain;

/**
 * A request that is well formed but breaks a business rule (documented as RN-xx in
 * docs/backend/requisitos.md). Mapped to HTTP 422.
 */
public class BusinessRuleViolation extends RuntimeException {

	private final String rule;

	public BusinessRuleViolation(String rule, String message) {
		super(message);
		this.rule = rule;
	}

	public String rule() {
		return rule;
	}

}
