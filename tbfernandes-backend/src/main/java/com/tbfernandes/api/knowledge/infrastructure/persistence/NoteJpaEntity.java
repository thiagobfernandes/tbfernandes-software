package com.tbfernandes.api.knowledge.infrastructure.persistence;

import java.util.HashSet;
import java.util.Set;

import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(schema = "knowledge", name = "note")
class NoteJpaEntity extends AuditedEntity {

	String title;

	String body;

	@JdbcTypeCode(SqlTypes.ARRAY)
	String[] tags;

	@ElementCollection
	@CollectionTable(schema = "knowledge", name = "note_link", joinColumns = @JoinColumn(name = "note_id"))
	Set<LinkEmbeddable> links = new HashSet<>();

}
