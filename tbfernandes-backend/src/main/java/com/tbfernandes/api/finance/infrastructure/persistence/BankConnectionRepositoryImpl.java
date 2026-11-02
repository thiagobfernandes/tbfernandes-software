package com.tbfernandes.api.finance.infrastructure.persistence;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.finance.domain.AccountType;
import com.tbfernandes.api.finance.domain.BankConnection;
import com.tbfernandes.api.finance.domain.BankConnectionRepository;
import com.tbfernandes.api.finance.domain.ConnectionStatus;
import com.tbfernandes.api.finance.domain.EntryScope;
import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Component;

@Component
class BankConnectionRepositoryImpl implements BankConnectionRepository {

	private final BankConnectionJpa jpa;
	private final EntityManager entityManager;

	BankConnectionRepositoryImpl(BankConnectionJpa jpa, EntityManager entityManager) {
		this.jpa = jpa;
		this.entityManager = entityManager;
	}

	@Override
	public BankConnection save(BankConnection connection) {
		ConnectionEntity e = jpa.findById(connection.id()).orElseGet(ConnectionEntity::new);
		e.id = connection.id();
		e.ownerId = connection.ownerId();
		e.externalId = connection.externalId();
		BankConnection.Details d = connection.details();
		e.institution = d.institution();
		e.scope = d.scope();
		e.status = d.status();
		e.lastSyncedAt = d.lastSyncedAt();
		e.lastError = d.lastError();
		e.accounts.clear();
		d.accounts().forEach(a -> e.accounts.add(toRow(a)));
		return toDomain(jpa.save(e));
	}

	@Override
	public BankConnection saveIfAbsent(BankConnection connection) {
		BankConnection.Details d = connection.details();
		jpa.insertIfAbsent(connection.id(), connection.ownerId(), connection.externalId(), d.institution(),
				d.scope().name(), d.status().name());
		return findByExternalId(connection.externalId()).orElseThrow();
	}

	@Override
	public Optional<BankConnection> find(UUID ownerId, UUID id) {
		return jpa.findByOwnerIdAndId(ownerId, id).map(BankConnectionRepositoryImpl::toDomain);
	}

	@Override
	public Optional<BankConnection> findByExternalId(String externalId) {
		return jpa.findByExternalId(externalId).map(BankConnectionRepositoryImpl::toDomain);
	}

	@Override
	public Optional<BankConnection> lockByExternalId(String externalId) {
		return jpa.lockIdByExternalId(externalId).map(id -> {
			// Loaded earlier in this transaction, the entity may predate what the lock waited for.
			ConnectionEntity entity = jpa.findById(id).orElseThrow();
			entityManager.refresh(entity);
			return toDomain(entity);
		});
	}

	@Override
	public List<BankConnection> findAll(UUID ownerId) {
		return jpa.findByOwnerId(ownerId, Sort.by("institution"))
			.stream()
			.map(BankConnectionRepositoryImpl::toDomain)
			.toList();
	}

	@Override
	public void delete(BankConnection connection) {
		jpa.deleteById(connection.id());
	}

	private static BankConnection toDomain(ConnectionEntity e) {
		return BankConnection.restore(e.id, e.ownerId, e.externalId,
				new BankConnection.Details(e.institution, e.scope, e.status, e.lastSyncedAt, e.lastError,
						e.accounts.stream()
							.map(a -> new BankConnection.BankAccount(a.externalId, a.name, a.type, a.balance,
									a.currency))
							.toList()));
	}

	private static AccountRow toRow(BankConnection.BankAccount a) {
		AccountRow row = new AccountRow();
		row.externalId = a.externalId();
		row.name = a.name();
		row.type = a.type();
		row.balance = a.balance();
		row.currency = a.currency();
		return row;
	}

	@Entity
	@Table(schema = "finance", name = "bank_connection")
	static class ConnectionEntity extends AuditedEntity {

		String externalId;

		String institution;

		@Enumerated(EnumType.STRING)
		EntryScope scope;

		@Enumerated(EnumType.STRING)
		ConnectionStatus status;

		Instant lastSyncedAt;

		String lastError;

		@ElementCollection
		@CollectionTable(schema = "finance", name = "bank_account", joinColumns = @JoinColumn(name = "connection_id"))
		List<AccountRow> accounts = new ArrayList<>();

	}

	@Embeddable
	static class AccountRow {

		String externalId;

		String name;

		@Enumerated(EnumType.STRING)
		AccountType type;

		BigDecimal balance;

		String currency;

	}

}

interface BankConnectionJpa extends JpaRepository<BankConnectionRepositoryImpl.ConnectionEntity, UUID> {

	Optional<BankConnectionRepositoryImpl.ConnectionEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	Optional<BankConnectionRepositoryImpl.ConnectionEntity> findByExternalId(String externalId);

	/** Empty, without an error, when the row is gone: another transaction may have just deleted it. */
	@Query(value = "SELECT id FROM finance.bank_connection WHERE external_id = :externalId FOR UPDATE",
			nativeQuery = true)
	Optional<UUID> lockIdByExternalId(@Param("externalId") String externalId);

	List<BankConnectionRepositoryImpl.ConnectionEntity> findByOwnerId(UUID ownerId, Sort sort);

	@Modifying
	@Query(value = """
			INSERT INTO finance.bank_connection (id, owner_id, external_id, institution, scope, status)
			VALUES (:id, :ownerId, :externalId, :institution, :scope, :status)
			ON CONFLICT (external_id) DO NOTHING""", nativeQuery = true)
	int insertIfAbsent(@Param("id") UUID id, @Param("ownerId") UUID ownerId, @Param("externalId") String externalId,
			@Param("institution") String institution, @Param("scope") String scope, @Param("status") String status);

}
