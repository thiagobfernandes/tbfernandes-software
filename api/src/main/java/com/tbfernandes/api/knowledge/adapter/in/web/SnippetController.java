package com.tbfernandes.api.knowledge.adapter.in.web;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.knowledge.application.SnippetService;
import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import com.tbfernandes.api.knowledge.domain.snippet.Snippet;
import com.tbfernandes.api.knowledge.domain.snippet.SnippetDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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

	record SnippetRequest(@NotBlank @Size(max = 200) String title, @NotBlank @Size(max = 30) String language,
			@NotBlank String code, @Size(max = 5000) String explanation, @Size(max = 2000) String sourceUrl,
			List<String> tags, Set<UUID> projectIds, Set<UUID> taskIds) {

		SnippetDetails details() {
			return new SnippetDetails(title, language, code, explanation, sourceUrl, tags);
		}

		KnowledgeLinks links() {
			return new KnowledgeLinks(projectIds, taskIds);
		}

	}

	record SnippetResponse(UUID id, String title, String language, String code, String explanation,
			String sourceUrl, List<String> tags, List<UUID> projectIds, List<UUID> taskIds, Instant createdAt,
			Instant updatedAt) {

		static SnippetResponse from(Snippet snippet) {
			SnippetDetails d = snippet.details();
			return new SnippetResponse(snippet.id(), d.title(), d.language(), d.code(), d.explanation(),
					d.sourceUrl(), d.tags(), Sorted.ids(snippet.links().projectIds()),
					Sorted.ids(snippet.links().taskIds()), snippet.createdAt(), snippet.updatedAt());
		}

	}

}
