package com.tbfernandes.api.knowledge.domain.note;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port: implemented by the persistence adapter. */
public interface NoteRepository {

	Note save(Note note);

	Optional<Note> findById(UUID ownerId, UUID id);

	/** text matches title and body (full-text, KNW-04); tag matches exactly; both optional. */
	List<Note> search(UUID ownerId, String text, String tag);

	List<Note> linkedTo(UUID ownerId, UUID workItemId);

	void delete(Note note);

}
