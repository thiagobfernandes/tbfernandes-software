package com.tbfernandes.api.identity.application;

import com.tbfernandes.api.identity.domain.AppUser;
import com.tbfernandes.api.identity.domain.AppUserRepository;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.NotFound;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The signed-in user's own account (IDN-03). */
@Service
@Transactional
public class ProfileService {

	private final AppUserRepository users;
	private final OwnerContext owner;
	private final PasswordEncoder passwords;

	ProfileService(AppUserRepository users, OwnerContext owner, PasswordEncoder passwords) {
		this.users = users;
		this.owner = owner;
		this.passwords = passwords;
	}

	@Transactional(readOnly = true)
	public AppUser me() {
		return users.findById(owner.currentOwnerId())
			.orElseThrow(() -> new NotFound("User", owner.currentOwnerId()));
	}

	public AppUser updateProfile(AppUser.Profile profile) {
		AppUser user = me();
		user.updateProfile(profile);
		return users.save(user);
	}

	/** RN-25: the current password is required, and the new one has at least 12 characters. */
	public void changePassword(String current, String next) {
		AppUser user = me();
		if (user.canLogIn() && (current == null || !passwords.matches(current, user.passwordHash()))) {
			throw new BusinessRuleViolation("RN-25", "The current password is wrong");
		}
		user.changePasswordHash(passwords.encode(PasswordPolicy.check(next)));
		users.save(user);
	}

}
