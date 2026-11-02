package com.tbfernandes.api.work.protocols;

import java.time.LocalDate;

import com.tbfernandes.api.work.domain.company.CompanyDetails;
import com.tbfernandes.api.work.domain.company.CompanyRelationship;
import com.tbfernandes.api.work.domain.company.CompanyStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CompanyRequest(@NotBlank @Size(max = 120) String name, @Size(max = 120) String tradeName,
		@NotNull CompanyRelationship relationship, CompanyStatus status, @Size(max = 2000) String description,
		@NotNull LocalDate startDate, @Size(max = 120) String mainContact) {

	public CompanyDetails toDetails() {
		return new CompanyDetails(name, tradeName, relationship, status, description, startDate, mainContact);
	}

}
