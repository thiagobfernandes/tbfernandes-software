package com.tbfernandes.api.knowledge.adapter.out.persistence;

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
@Table(schema = "knowledge", name = "snippet")
class SnippetJpaEntity extends AuditedEntity {

	String title;

	String language;

	String code;

	String explanation;

	String sourceUrl;

	@JdbcTypeCode(SqlTypes.ARRAY)
	String[] tags;

	@ElementCollection
	@CollectionTable(schema = "knowledge", name = "snippet_link", joinColumns = @JoinColumn(name = "snippet_id"))
	Set<LinkEmbeddable> links = new HashSet<>();

}
