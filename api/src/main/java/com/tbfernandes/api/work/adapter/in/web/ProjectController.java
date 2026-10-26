package com.tbfernandes.api.work.adapter.in.web;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.work.application.project.ProjectService;
import com.tbfernandes.api.work.domain.project.Project;
import com.tbfernandes.api.work.domain.project.ProjectCategory;
import com.tbfernandes.api.work.domain.project.ProjectColor;
import com.tbfernandes.api.work.domain.project.ProjectDetails;
import com.tbfernandes.api.work.domain.project.ProjectStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
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

	record ProjectRequest(@NotBlank @Size(max = 120) String name, @Size(max = 2000) String description,
			UUID companyId, @NotNull ProjectCategory category, ProjectStatus status, ProjectColor color,
			@NotNull LocalDate startDate, LocalDate dueDate, @Size(max = 200) String nextDelivery, UUID goalId) {

		ProjectDetails toDetails() {
			return new ProjectDetails(name, description, companyId, category, status, color, startDate, dueDate,
					nextDelivery, goalId);
		}

	}

	record ProjectResponse(UUID id, String name, String description, UUID companyId, ProjectCategory category,
			ProjectStatus status, ProjectColor color, LocalDate startDate, LocalDate dueDate, String nextDelivery,
			UUID goalId) {

		static ProjectResponse from(Project project) {
			ProjectDetails d = project.details();
			return new ProjectResponse(project.id(), d.name(), d.description(), d.companyId(), d.category(),
					d.status(), d.color(), d.startDate(), d.dueDate(), d.nextDelivery(), d.goalId());
		}

	}

}
