package com.tbfernandes.api.identity.protocols;

import java.util.UUID;

import com.tbfernandes.api.identity.domain.AppUser;

public record MeResponse(UUID id, String name, String email, String locale, String timeZone, boolean hasPassword) {

	public static MeResponse from(AppUser user) {
		AppUser.Profile p = user.profile();
		return new MeResponse(user.id(), p.name(), p.email(), p.locale(), p.timeZone(), user.canLogIn());
	}

}
