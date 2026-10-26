package com.tbfernandes.api.work.adapter.out.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/** Columns every table has: id, owner_id, created_at, updated_at and version (optimistic lock). */
@MappedSuperclass
abstract class AuditedEntity {

	@Id
	UUID id;

	@Column(name = "owner_id", nullable = false, updatable = false)
	UUID ownerId;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	Instant updatedAt;

	@Version
	long version;

}
