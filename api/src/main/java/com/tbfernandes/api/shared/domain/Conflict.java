package com.tbfernandes.api.shared.domain;

/**
 * The request conflicts with the current state, e.g. deleting a company that still has
 * projects (RN-01). Mapped to HTTP 409.
 */
public class Conflict extends BusinessRuleViolation {

	public Conflict(String rule, String message) {
		super(rule, message);
	}

}
