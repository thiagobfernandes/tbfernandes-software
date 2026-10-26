package com.tbfernandes.api.shared.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Columns every aggregate-root table has: id, owner_id, created_at, updated_at and version
 * (optimistic lock). Fields are public so each module's persistence adapter can map them
 * directly; only adapters ever see these entities.
 */
@MappedSuperclass
public abstract class AuditedEntity {

	@Id
	public UUID id;

	@Column(name = "owner_id", nullable = false, updatable = false)
	public UUID ownerId;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	public Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	public Instant updatedAt;

	@Version
	public long version;

}
