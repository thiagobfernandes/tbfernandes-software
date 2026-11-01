package com.tbfernandes.api.knowledge.protocols;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.note.Note;

/** Same shape as Note in web/src/features/knowledge/types/knowledge.ts. */
public record NoteResponse(UUID id, String title, String body, List<String> tags, List<UUID> projectIds,
		List<UUID> taskIds, Instant createdAt, Instant updatedAt) {

	public static NoteResponse from(Note note) {
		return new NoteResponse(note.id(), note.title(), note.body(), note.tags(),
				Sorted.ids(note.links().projectIds()), Sorted.ids(note.links().taskIds()), note.createdAt(),
				note.updatedAt());
	}

}
