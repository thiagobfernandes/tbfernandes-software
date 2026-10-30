package com.tbfernandes.api.work.domain.company;

import java.time.LocalDate;

/** The editable fields of a company, as one value. */
public record CompanyDetails(String name, String tradeName, CompanyRelationship relationship, CompanyStatus status,
		String description, LocalDate startDate, String mainContact) {
}
