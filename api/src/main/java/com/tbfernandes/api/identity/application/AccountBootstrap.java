package com.tbfernandes.api.identity.application;

import java.util.UUID;

import com.tbfernandes.api.identity.domain.AppUser;
import com.tbfernandes.api.identity.domain.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the owner account at startup, or gives an existing one a password, when
 * tbf.auth.bootstrap.email and password are set. There is no public sign-up.
 */
@Component
class AccountBootstrap {

	private static final Logger log = LoggerFactory.getLogger(AccountBootstrap.class);

	private final AuthProperties properties;
	private final AppUserRepository users;
	private final PasswordEncoder passwords;

	AccountBootstrap(AuthProperties properties, AppUserRepository users, PasswordEncoder passwords) {
		this.properties = properties;
		this.users = users;
		this.passwords = passwords;
	}

	@EventListener(ApplicationReadyEvent.class)
	@Transactional
	public void bootstrap() {
		AuthProperties.Bootstrap b = properties.bootstrap();
		if (!b.configured()) {
			return;
		}
		AppUser user = users.findByEmail(b.email()).orElseGet(() -> {
			UUID id = users.findById(properties.ownerId()).isPresent() ? UUID.randomUUID() : properties.ownerId();
			log.info("Creating account {}", b.email());
			return AppUser.create(id, new AppUser.Profile(b.name() == null ? b.email() : b.name(), b.email(), null,
					null));
		});
		if (!user.canLogIn()) {
			user.changePasswordHash(passwords.encode(PasswordPolicy.check(b.password())));
			log.info("Password set for account {}", b.email());
		}
		users.save(user);
	}

}
