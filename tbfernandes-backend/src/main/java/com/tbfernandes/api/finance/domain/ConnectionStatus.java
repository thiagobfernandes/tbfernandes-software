package com.tbfernandes.api.finance.domain;

/** Health of a bank connection, as last reported by the provider. */
public enum ConnectionStatus {

	ACTIVE,

	/** The bank needs the user again: new password, MFA or expired consent. */
	NEEDS_RECONNECT,

	ERROR

}
