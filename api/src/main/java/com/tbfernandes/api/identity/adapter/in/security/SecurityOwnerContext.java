package com.tbfernandes.api.identity.adapter.in.security;

import java.util.UUID;

import com.tbfernandes.api.identity.application.AuthProperties;
import com.tbfernandes.api.shared.application.OwnerContext;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * IDN-02: the owner is the signed-in account. In single-user mode, requests without a login
 * act as tbf.auth.owner-id, as before.
 */
@Component
class SecurityOwnerContext implements OwnerContext {

	private final AuthProperties properties;

	SecurityOwnerContext(AuthProperties properties) {
		this.properties = properties;
	}

	@Override
	public UUID currentOwnerId() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth != null && auth.getPrincipal() instanceof OwnerPrincipal principal) {
			return principal.id();
		}
		if (!properties.sessionMode()) {
			return properties.ownerId();
		}
		throw new AuthenticationCredentialsNotFoundException("Sem login");
	}

}
