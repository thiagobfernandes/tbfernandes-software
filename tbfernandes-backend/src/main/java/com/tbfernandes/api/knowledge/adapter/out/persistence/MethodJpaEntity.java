package com.tbfernandes.api.knowledge.adapter.out.persistence;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.tbfernandes.api.knowledge.domain.method.MethodCategory;
import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(schema = "knowledge", name = "method")
class MethodJpaEntity extends AuditedEntity {

	String title;

	String summary;

	@Enumerated(EnumType.STRING)
	MethodCategory category;

	@JdbcTypeCode(SqlTypes.ARRAY)
	String[] tags;

	LocalDate lastReviewed;

	@ElementCollection
	@CollectionTable(schema = "knowledge", name = "method_step", joinColumns = @JoinColumn(name = "method_id"))
	@OrderColumn(name = "position")
	List<StepEmbeddable> steps = new ArrayList<>();

	@ElementCollection
	@CollectionTable(schema = "knowledge", name = "method_example", joinColumns = @JoinColumn(name = "method_id"))
	@OrderColumn(name = "position")
	List<ExampleEmbeddable> examples = new ArrayList<>();

	@Embeddable
	record StepEmbeddable(String title, String detail) {
	}

	@Embeddable
	record ExampleEmbeddable(String title, String content) {
	}

}
