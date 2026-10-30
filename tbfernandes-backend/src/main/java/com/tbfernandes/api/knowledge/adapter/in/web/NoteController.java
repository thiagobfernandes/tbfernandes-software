package com.tbfernandes.api.knowledge.adapter.in.web;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.knowledge.application.NoteService;
import com.tbfernandes.api.knowledge.application.NoteService.NoteInput;
import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import com.tbfernandes.api.knowledge.domain.note.Note;
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
@RequestMapping("/api/v1/notes")
class NoteController {

	private final NoteService service;

	NoteController(NoteService service) {
		this.service = service;
	}

	/** q searches title and body; tag filters exactly (KNW-04). */
	@GetMapping
	List<NoteResponse> list(@RequestParam(required = false) String q, @RequestParam(required = false) String tag) {
		return service.search(q, tag).stream().map(NoteResponse::from).toList();
	}

	@GetMapping("/{id}")
	NoteResponse get(@PathVariable UUID id) {
		return NoteResponse.from(service.get(id));
	}

	@PostMapping
	ResponseEntity<NoteResponse> create(@Valid @RequestBody NoteRequest request) {
		Note note = service.create(request.toInput());
		return ResponseEntity.created(URI.create("/api/v1/notes/" + note.id())).body(NoteResponse.from(note));
	}

	@PutMapping("/{id}")
	NoteResponse update(@PathVariable UUID id, @Valid @RequestBody NoteRequest request) {
		return NoteResponse.from(service.update(id, request.toInput()));
	}

	@DeleteMapping("/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	record NoteRequest(@NotBlank @Size(max = 200) String title, String body, List<String> tags,
			Set<UUID> projectIds, Set<UUID> taskIds) {

		NoteInput toInput() {
			return new NoteInput(title, body, tags, new KnowledgeLinks(projectIds, taskIds));
		}

	}

	/** Same shape as Note in web/src/features/knowledge/types/knowledge.ts. */
	record NoteResponse(UUID id, String title, String body, List<String> tags, List<UUID> projectIds,
			List<UUID> taskIds, Instant createdAt, Instant updatedAt) {

		static NoteResponse from(Note note) {
			return new NoteResponse(note.id(), note.title(), note.body(), note.tags(),
					Sorted.ids(note.links().projectIds()), Sorted.ids(note.links().taskIds()), note.createdAt(),
					note.updatedAt());
		}

	}

}
