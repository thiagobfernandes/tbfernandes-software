package com.tbfernandes.api.work.adapter.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.work.domain.company.Company;
import com.tbfernandes.api.work.domain.company.CompanyDetails;
import com.tbfernandes.api.work.domain.company.CompanyRepository;
import org.springframework.stereotype.Component;

/**
 * Implements the company port with Spring Data JPA. Mapping is explicit so the domain
 * classes never carry persistence annotations.
 */
@Component
class CompanyPersistenceAdapter implements CompanyRepository {

	private final CompanyJpaRepository companies;

	CompanyPersistenceAdapter(CompanyJpaRepository companies) {
		this.companies = companies;
	}

	@Override
	public Company save(Company company) {
		CompanyJpaEntity entity = companies.findById(company.id()).orElseGet(CompanyJpaEntity::new);
		entity.id = company.id();
		entity.ownerId = company.ownerId();
		CompanyDetails d = company.details();
		entity.name = d.name();
		entity.tradeName = d.tradeName();
		entity.relationship = d.relationship();
		entity.status = d.status();
		entity.description = d.description();
		entity.startDate = d.startDate();
		entity.mainContact = d.mainContact();
		return toDomain(companies.save(entity));
	}

	@Override
	public Optional<Company> findById(UUID ownerId, UUID id) {
		return companies.findByOwnerIdAndId(ownerId, id).map(CompanyPersistenceAdapter::toDomain);
	}

	@Override
	public List<Company> findAll(UUID ownerId) {
		return companies.findByOwnerIdOrderByName(ownerId).stream().map(CompanyPersistenceAdapter::toDomain).toList();
	}

	@Override
	public boolean exists(UUID ownerId, UUID id) {
		return companies.existsByOwnerIdAndId(ownerId, id);
	}

	@Override
	public void delete(Company company) {
		companies.deleteById(company.id());
	}

	private static Company toDomain(CompanyJpaEntity e) {
		return Company.restore(e.id, e.ownerId, new CompanyDetails(e.name, e.tradeName, e.relationship, e.status,
				e.description, e.startDate, e.mainContact));
	}

}
