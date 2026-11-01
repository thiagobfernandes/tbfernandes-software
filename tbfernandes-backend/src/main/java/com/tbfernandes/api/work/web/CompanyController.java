package com.tbfernandes.api.work.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.application.company.CompanyService;
import com.tbfernandes.api.work.domain.company.Company;
import com.tbfernandes.api.work.protocols.CompanyRequest;
import com.tbfernandes.api.work.protocols.CompanyResponse;
import jakarta.validation.Valid;
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

}
