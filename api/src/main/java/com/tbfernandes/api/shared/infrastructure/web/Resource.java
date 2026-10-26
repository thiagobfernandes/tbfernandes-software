package com.tbfernandes.api.shared.infrastructure.web;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.tbfernandes.api.shared.domain.Aggregate;

/**
 * Response body for aggregates built on {@link Aggregate}: the id plus the details fields at
 * the same level, which is the shape of the frontend types ({@code {id, name, ...}}).
 */
public record Resource<D>(UUID id, @JsonUnwrapped D details) {

	public static <D> Resource<D> of(Aggregate<D> aggregate) {
		return new Resource<>(aggregate.id(), aggregate.details());
	}

}
