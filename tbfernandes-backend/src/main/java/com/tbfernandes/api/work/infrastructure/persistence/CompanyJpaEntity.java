package com.tbfernandes.api.work.infrastructure.persistence;

import java.time.LocalDate;

import com.tbfernandes.api.work.domain.company.CompanyRelationship;
import com.tbfernandes.api.work.domain.company.CompanyStatus;
import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(schema = "work", name = "company")
class CompanyJpaEntity extends AuditedEntity {

	String name;

	String tradeName;

	@Enumerated(EnumType.STRING)
	CompanyRelationship relationship;

	@Enumerated(EnumType.STRING)
	CompanyStatus status;

	String description;

	LocalDate startDate;

	String mainContact;

}
