package com.tbfernandes.api.knowledge;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Read access to notes and snippets for other modules (assistant). */
public interface KnowledgeLookup {

	List<NoteView> notes(UUID ownerId);

	List<SnippetView> snippets(UUID ownerId);

	record NoteView(UUID id, String title, String body, List<String> tags, Set<UUID> projectIds, Set<UUID> taskIds) {
	}

	record SnippetView(UUID id, String title, String explanation, List<String> tags, Set<UUID> projectIds,
			Set<UUID> taskIds) {
	}

}
