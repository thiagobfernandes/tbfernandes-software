package com.tbfernandes.api.shared.domain;

/** An external provider failed or could not be reached. Mapped to HTTP 502. */
public class ExternalServiceFailure extends RuntimeException {

	public ExternalServiceFailure(String message, Throwable cause) {
		super(message, cause);
	}

}
