package com.tbfernandes.api.shared.infrastructure.config;

import java.util.UUID;

import com.tbfernandes.api.shared.application.OwnerContext;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Single-user phase: the owner comes from configuration (tbf.owner.id).
 * Replaced by the authenticated user when identity/login lands (backlog IDN-01).
 */
@Component
class ConfiguredOwnerContext implements OwnerContext {

	private final UUID ownerId;

	ConfiguredOwnerContext(OwnerProperties properties) {
		this.ownerId = properties.id();
	}

	@Override
	public UUID currentOwnerId() {
		return ownerId;
	}

	@ConfigurationProperties("tbf.owner")
	record OwnerProperties(UUID id) {
	}

}
