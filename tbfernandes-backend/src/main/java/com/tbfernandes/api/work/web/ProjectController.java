package com.tbfernandes.api.work.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.application.project.ProjectService;
import com.tbfernandes.api.work.domain.project.Project;
import com.tbfernandes.api.work.protocols.ProjectRequest;
import com.tbfernandes.api.work.protocols.ProjectResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/projects")
class ProjectController {

	private final ProjectService service;

	ProjectController(ProjectService service) {
		this.service = service;
	}

	@GetMapping
	List<ProjectResponse> list(@RequestParam(required = false) UUID companyId) {
		return service.list(companyId).stream().map(ProjectResponse::from).toList();
	}

	@GetMapping("/{id}")
	ProjectResponse get(@PathVariable UUID id) {
		return ProjectResponse.from(service.get(id));
	}

	@PostMapping
	ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest request) {
		Project project = service.create(request.toDetails());
		return ResponseEntity.created(URI.create("/api/v1/projects/" + project.id()))
			.body(ProjectResponse.from(project));
	}

	@PutMapping("/{id}")
	ProjectResponse update(@PathVariable UUID id, @Valid @RequestBody ProjectRequest request) {
		return ProjectResponse.from(service.update(id, request.toDetails()));
	}

	@DeleteMapping("/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

}
