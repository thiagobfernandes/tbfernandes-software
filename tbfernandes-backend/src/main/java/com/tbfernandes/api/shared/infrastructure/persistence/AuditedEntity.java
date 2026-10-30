package com.tbfernandes.api.shared.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PostLoad;
import jakarta.persistence.Version;
import com.tbfernandes.api.shared.domain.ClientIds;
import com.tbfernandes.api.shared.domain.Conflict;
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

	/**
	 * ADR-007: a row loaded with the id the client chose for a new record already existed, so
	 * the create would overwrite it. Refuse instead (409), whoever owns that row.
	 */
	@PostLoad
	void refuseTakenClientId() {
		if (ClientIds.assignedInThisRequest(id)) {
			throw new Conflict("ADR-007", "O id " + id + " já está em uso");
		}
	}

}
