package com.tbfernandes.api.knowledge.domain.method;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Implemented in the module's infrastructure.persistence package. */
public interface MethodRepository {

	Method save(Method method);

	Optional<Method> findById(UUID ownerId, UUID id);

	List<Method> findAll(UUID ownerId);

	void delete(Method method);

}
