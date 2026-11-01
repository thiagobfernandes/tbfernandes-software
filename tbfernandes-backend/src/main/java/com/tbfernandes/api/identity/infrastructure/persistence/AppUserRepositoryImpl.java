package com.tbfernandes.api.identity.infrastructure.persistence;

import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.identity.domain.AppUser;
import com.tbfernandes.api.identity.domain.AppUserRepository;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
class AppUserRepositoryImpl implements AppUserRepository {

	private final AppUserJpa users;

	AppUserRepositoryImpl(AppUserJpa users) {
		this.users = users;
	}

	@Override
	public AppUser save(AppUser user) {
		AppUserEntity e = users.findById(user.id()).orElseGet(AppUserEntity::new);
		e.id = user.id();
		e.name = user.profile().name();
		e.email = user.profile().email();
		e.locale = user.profile().locale();
		e.timeZone = user.profile().timeZone();
		e.passwordHash = user.passwordHash();
		return toDomain(users.save(e));
	}

	@Override
	public Optional<AppUser> findById(UUID id) {
		return users.findById(id).map(AppUserRepositoryImpl::toDomain);
	}

	@Override
	public Optional<AppUser> findByEmail(String email) {
		return users.findByEmail(email.strip().toLowerCase(Locale.ROOT)).map(AppUserRepositoryImpl::toDomain);
	}

	private static AppUser toDomain(AppUserEntity e) {
		return AppUser.restore(e.id, new AppUser.Profile(e.name, e.email, e.locale, e.timeZone), e.passwordHash);
	}

	/** identity.app_user has no owner_id: the user is the owner. */
	@Entity
	@Table(schema = "identity", name = "app_user")
	static class AppUserEntity {

		@Id
		UUID id;

		String name;

		String email;

		String locale;

		String timeZone;

		@Column(name = "password_hash")
		String passwordHash;

		@CreationTimestamp
		@Column(updatable = false)
		Instant createdAt;

		@UpdateTimestamp
		Instant updatedAt;

		@Version
		long version;

	}

}

interface AppUserJpa extends JpaRepository<AppUserRepositoryImpl.AppUserEntity, UUID> {

	Optional<AppUserRepositoryImpl.AppUserEntity> findByEmail(String email);

}
