package com.tbfernandes.api.shared.domain;

import java.util.UUID;

/** The resource does not exist or belongs to another owner. Mapped to HTTP 404. */
public class NotFound extends RuntimeException {

	public NotFound(String resource, UUID id) {
		super(resource + " " + id + " not found");
	}

}
