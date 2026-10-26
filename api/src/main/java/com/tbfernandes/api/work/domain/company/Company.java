package com.tbfernandes.api.work.domain.company;

import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/**
 * A company you work for, with, or own. A company with projects is closed rather than
 * deleted, because projects and history point to it (RN-01).
 */
public final class Company {

	private final UUID id;
	private final UUID ownerId;
	private String name;
	private String tradeName;
	private CompanyRelationship relationship;
	private CompanyStatus status;
	private String description;
	private LocalDate startDate;
	private String mainContact;

	private Company(UUID id, UUID ownerId) {
		this.id = id;
		this.ownerId = ownerId;
	}

	public static Company create(UUID ownerId, CompanyDetails details) {
		Company company = new Company(Ids.forNewAggregate(), Require.present(ownerId, "ownerId"));
		company.apply(details);
		return company;
	}

	/** Rebuilds a company already stored; no rules run. */
	public static Company restore(UUID id, UUID ownerId, CompanyDetails details) {
		Company company = new Company(id, ownerId);
		company.name = details.name();
		company.tradeName = details.tradeName();
		company.relationship = details.relationship();
		company.status = details.status();
		company.description = details.description();
		company.startDate = details.startDate();
		company.mainContact = details.mainContact();
		return company;
	}

	public void update(CompanyDetails details) {
		apply(details);
	}

	private void apply(CompanyDetails details) {
		this.name = Require.text(details.name(), "name", 120);
		this.tradeName = Require.optionalText(details.tradeName(), "tradeName", 120);
		this.relationship = Require.present(details.relationship(), "relationship");
		this.status = details.status() == null ? CompanyStatus.ACTIVE : details.status();
		this.description = Require.optionalText(details.description(), "description", 2000);
		this.startDate = Require.present(details.startDate(), "startDate");
		this.mainContact = Require.optionalText(details.mainContact(), "mainContact", 120);
	}

	public CompanyDetails details() {
		return new CompanyDetails(name, tradeName, relationship, status, description, startDate, mainContact);
	}

	public UUID id() {
		return id;
	}

	public UUID ownerId() {
		return ownerId;
	}

	public CompanyStatus status() {
		return status;
	}

}
