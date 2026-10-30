package com.tbfernandes.api.identity.domain;

import java.util.Optional;
import java.util.UUID;

/** Output port for accounts. */
public interface AppUserRepository {

	AppUser save(AppUser user);

	Optional<AppUser> findById(UUID id);

	Optional<AppUser> findByEmail(String email);

}
