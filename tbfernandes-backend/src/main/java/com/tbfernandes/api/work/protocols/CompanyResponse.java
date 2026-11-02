package com.tbfernandes.api.work.protocols;

import java.time.LocalDate;
import java.util.UUID;

import com.tbfernandes.api.work.domain.company.Company;
import com.tbfernandes.api.work.domain.company.CompanyDetails;
import com.tbfernandes.api.work.domain.company.CompanyRelationship;
import com.tbfernandes.api.work.domain.company.CompanyStatus;

public record CompanyResponse(UUID id, String name, String tradeName, CompanyRelationship relationship,
		CompanyStatus status, String description, LocalDate startDate, String mainContact) {

	public static CompanyResponse from(Company company) {
		CompanyDetails d = company.details();
		return new CompanyResponse(company.id(), d.name(), d.tradeName(), d.relationship(), d.status(),
				d.description(), d.startDate(), d.mainContact());
	}

}
