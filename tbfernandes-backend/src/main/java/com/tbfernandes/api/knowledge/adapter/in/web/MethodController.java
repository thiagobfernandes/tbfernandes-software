package com.tbfernandes.api.knowledge.adapter.in.web;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.application.MethodService;
import com.tbfernandes.api.knowledge.domain.method.Method;
import com.tbfernandes.api.knowledge.domain.method.Method.Example;
import com.tbfernandes.api.knowledge.domain.method.Method.MethodDetails;
import com.tbfernandes.api.knowledge.domain.method.Method.Step;
import com.tbfernandes.api.knowledge.domain.method.MethodCategory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
@RequestMapping("/api/v1/methods")
class MethodController {

	private final MethodService service;

	MethodController(MethodService service) {
		this.service = service;
	}

	@GetMapping
	List<MethodResponse> list() {
		return service.list().stream().map(MethodResponse::from).toList();
	}

	@GetMapping("/{id}")
	MethodResponse get(@PathVariable UUID id) {
		return MethodResponse.from(service.get(id));
	}

	@PostMapping
	ResponseEntity<MethodResponse> create(@Valid @RequestBody MethodRequest request) {
		Method method = service.create(request.toDetails());
		return ResponseEntity.created(URI.create("/api/v1/methods/" + method.id())).body(MethodResponse.from(method));
	}

	@PutMapping("/{id}")
	MethodResponse update(@PathVariable UUID id, @Valid @RequestBody MethodRequest request) {
		return MethodResponse.from(service.update(id, request.toDetails()));
	}

	@DeleteMapping("/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	record MethodRequest(@NotBlank @Size(max = 200) String title, @NotBlank @Size(max = 1000) String summary,
			@NotNull MethodCategory category, @NotEmpty List<Step> steps, List<Example> examples, List<String> tags,
			@NotNull LocalDate lastReviewed) {

		MethodDetails toDetails() {
			return new MethodDetails(title, summary, category, steps, examples, tags, lastReviewed);
		}

	}

	/** Same shape as Method in web/src/features/methods/types/method.ts. */
	record MethodResponse(UUID id, String title, String summary, MethodCategory category, List<Step> steps,
			List<Example> examples, List<String> tags, LocalDate lastReviewed) {

		static MethodResponse from(Method method) {
			MethodDetails d = method.details();
			return new MethodResponse(method.id(), d.title(), d.summary(), d.category(), d.steps(), d.examples(),
					d.tags(), d.lastReviewed());
		}

	}

}
