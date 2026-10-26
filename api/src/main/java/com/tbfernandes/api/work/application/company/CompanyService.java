package com.tbfernandes.api.work.application.company;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.Conflict;
import com.tbfernandes.api.shared.domain.NotFound;
import com.tbfernandes.api.work.CompanyDeleted;
import com.tbfernandes.api.work.domain.company.Company;
import com.tbfernandes.api.work.domain.company.CompanyDetails;
import com.tbfernandes.api.work.domain.company.CompanyRepository;
import com.tbfernandes.api.work.domain.project.ProjectRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Company use cases (RF-WRK-01..03, WRK-11). */
@Service
@Transactional
public class CompanyService {

	private final CompanyRepository companies;
	private final ProjectRepository projects;
	private final OwnerContext owner;
	private final ApplicationEventPublisher events;

	public CompanyService(CompanyRepository companies, ProjectRepository projects, OwnerContext owner,
			ApplicationEventPublisher events) {
		this.companies = companies;
		this.projects = projects;
		this.owner = owner;
		this.events = events;
	}

	public Company create(CompanyDetails details) {
		return companies.save(Company.create(owner.currentOwnerId(), details));
	}

	public Company update(UUID id, CompanyDetails details) {
		Company company = get(id);
		company.update(details);
		return companies.save(company);
	}

	/** RN-01: only a company without projects can be deleted; otherwise close it. */
	public void delete(UUID id) {
		Company company = get(id);
		if (projects.anyForCompany(company.ownerId(), id)) {
			throw new Conflict("RN-01", "The company has projects; close it instead of deleting");
		}
		companies.delete(company);
		events.publishEvent(new CompanyDeleted(company.ownerId(), id));
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
