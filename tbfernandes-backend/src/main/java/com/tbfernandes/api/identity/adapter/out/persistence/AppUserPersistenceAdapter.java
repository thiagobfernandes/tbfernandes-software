package com.tbfernandes.api.identity.adapter.out.persistence;

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
class AppUserPersistenceAdapter implements AppUserRepository {

	private final AppUserJpa users;

	AppUserPersistenceAdapter(AppUserJpa users) {
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
		return users.findById(id).map(AppUserPersistenceAdapter::toDomain);
	}

	@Override
	public Optional<AppUser> findByEmail(String email) {
		return users.findByEmail(email.strip().toLowerCase(Locale.ROOT)).map(AppUserPersistenceAdapter::toDomain);
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

interface AppUserJpa extends JpaRepository<AppUserPersistenceAdapter.AppUserEntity, UUID> {

	Optional<AppUserPersistenceAdapter.AppUserEntity> findByEmail(String email);

}
