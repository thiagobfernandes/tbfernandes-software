package com.tbfernandes.api.work.domain.company;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port: implemented by the persistence adapter. */
public interface CompanyRepository {

	Company save(Company company);

	Optional<Company> findById(UUID ownerId, UUID id);

	List<Company> findAll(UUID ownerId);

	boolean exists(UUID ownerId, UUID id);

	void delete(Company company);

}
