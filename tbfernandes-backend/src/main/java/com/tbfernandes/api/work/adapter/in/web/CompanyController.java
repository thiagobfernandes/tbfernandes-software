package com.tbfernandes.api.work.adapter.in.web;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.application.company.CompanyService;
import com.tbfernandes.api.work.domain.company.Company;
import com.tbfernandes.api.work.domain.company.CompanyDetails;
import com.tbfernandes.api.work.domain.company.CompanyRelationship;
import com.tbfernandes.api.work.domain.company.CompanyStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/companies")
class CompanyController {

	private final CompanyService service;

	CompanyController(CompanyService service) {
		this.service = service;
	}

	@GetMapping
	List<CompanyResponse> list() {
		return service.list().stream().map(CompanyResponse::from).toList();
	}

	@GetMapping("/{id}")
	CompanyResponse get(@PathVariable UUID id) {
		return CompanyResponse.from(service.get(id));
	}

	@PostMapping
	ResponseEntity<CompanyResponse> create(@Valid @RequestBody CompanyRequest request) {
		Company company = service.create(request.toDetails());
		return ResponseEntity.created(URI.create("/api/v1/companies/" + company.id()))
			.body(CompanyResponse.from(company));
	}

	@PutMapping("/{id}")
	CompanyResponse update(@PathVariable UUID id, @Valid @RequestBody CompanyRequest request) {
		return CompanyResponse.from(service.update(id, request.toDetails()));
	}

	@DeleteMapping("/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	record CompanyRequest(@NotBlank @Size(max = 120) String name, @Size(max = 120) String tradeName,
			@NotNull CompanyRelationship relationship, CompanyStatus status, @Size(max = 2000) String description,
			@NotNull LocalDate startDate, @Size(max = 120) String mainContact) {

		CompanyDetails toDetails() {
			return new CompanyDetails(name, tradeName, relationship, status, description, startDate, mainContact);
		}

	}

	record CompanyResponse(UUID id, String name, String tradeName, CompanyRelationship relationship,
			CompanyStatus status, String description, LocalDate startDate, String mainContact) {

		static CompanyResponse from(Company company) {
			CompanyDetails d = company.details();
			return new CompanyResponse(company.id(), d.name(), d.tradeName(), d.relationship(), d.status(),
					d.description(), d.startDate(), d.mainContact());
		}

	}

}
