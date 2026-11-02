package com.tbfernandes.api.knowledge.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.application.SnippetService;
import com.tbfernandes.api.knowledge.domain.snippet.Snippet;
import com.tbfernandes.api.knowledge.protocols.SnippetRequest;
import com.tbfernandes.api.knowledge.protocols.SnippetResponse;
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
@RequestMapping("/api/v1/snippets")
class SnippetController {

	private final SnippetService service;

	SnippetController(SnippetService service) {
		this.service = service;
	}

	@GetMapping
	List<SnippetResponse> list(@RequestParam(required = false) String q,
			@RequestParam(required = false) String language, @RequestParam(required = false) String tag) {
		return service.search(q, language, tag).stream().map(SnippetResponse::from).toList();
	}

	@GetMapping("/{id}")
	SnippetResponse get(@PathVariable UUID id) {
		return SnippetResponse.from(service.get(id));
	}

	@PostMapping
	ResponseEntity<SnippetResponse> create(@Valid @RequestBody SnippetRequest request) {
		Snippet snippet = service.create(request.details(), request.links());
		return ResponseEntity.created(URI.create("/api/v1/snippets/" + snippet.id()))
			.body(SnippetResponse.from(snippet));
	}

	@PutMapping("/{id}")
	SnippetResponse update(@PathVariable UUID id, @Valid @RequestBody SnippetRequest request) {
		return SnippetResponse.from(service.update(id, request.details(), request.links()));
	}

	@DeleteMapping("/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

}
