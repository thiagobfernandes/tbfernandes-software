package com.tbfernandes.api.knowledge.domain.snippet;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port: implemented by the persistence adapter. */
public interface SnippetRepository {

	Snippet save(Snippet snippet);

	Optional<Snippet> findById(UUID ownerId, UUID id);

	/** text matches title, explanation and code; language and tag match exactly; all optional. */
	List<Snippet> search(UUID ownerId, String text, String language, String tag);

	List<Snippet> linkedTo(UUID ownerId, UUID workItemId);

	void delete(Snippet snippet);

}
