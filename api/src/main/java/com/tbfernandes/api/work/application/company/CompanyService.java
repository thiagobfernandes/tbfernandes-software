package com.tbfernandes.api.work.application.company;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.NotFound;
import com.tbfernandes.api.work.domain.company.Company;
import com.tbfernandes.api.work.domain.company.CompanyDetails;
import com.tbfernandes.api.work.domain.company.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Company use cases (RF-WRK-01..03). */
@Service
@Transactional
public class CompanyService {

	private final CompanyRepository companies;
	private final OwnerContext owner;

	public CompanyService(CompanyRepository companies, OwnerContext owner) {
		this.companies = companies;
		this.owner = owner;
	}

	public Company create(CompanyDetails details) {
		return companies.save(Company.create(owner.currentOwnerId(), details));
	}

	public Company update(UUID id, CompanyDetails details) {
		Company company = get(id);
		company.update(details);
		return companies.save(company);
	}

	@Transactional(readOnly = true)
	public Company get(UUID id) {
		return companies.findById(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Company", id));
	}

	@Transactional(readOnly = true)
	public List<Company> list() {
		return companies.findAll(owner.currentOwnerId());
	}

}
