package com.tbfernandes.api.knowledge.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.application.MethodService;
import com.tbfernandes.api.knowledge.domain.method.Method;
import com.tbfernandes.api.knowledge.protocols.MethodRequest;
import com.tbfernandes.api.knowledge.protocols.MethodResponse;
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

}
