package com.tbfernandes.api.identity.application;

import com.tbfernandes.api.shared.domain.BusinessRuleViolation;

/** RN-25: length beats composition rules (NIST SP 800-63B). */
final class PasswordPolicy {

	static final int MIN_LENGTH = 12;

	private PasswordPolicy() {
	}

	static String check(String password) {
		if (password == null || password.length() < MIN_LENGTH || password.length() > 128) {
			throw new BusinessRuleViolation("RN-25",
					"A senha precisa ter entre " + MIN_LENGTH + " e 128 caracteres");
		}
		return password;
	}

}
