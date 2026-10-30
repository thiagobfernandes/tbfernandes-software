package com.tbfernandes.api.knowledge.application;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import com.tbfernandes.api.knowledge.domain.note.Note;
import com.tbfernandes.api.knowledge.domain.note.NoteRepository;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.NotFound;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Note use cases (RF-KNW-01, RF-KNW-03, RF-KNW-04). */
@Service
@Transactional
public class NoteService {

	private final NoteRepository notes;
	private final LinkValidator links;
	private final OwnerContext owner;

	NoteService(NoteRepository notes, LinkValidator links, OwnerContext owner) {
		this.notes = notes;
		this.links = links;
		this.owner = owner;
	}

	public Note create(NoteInput input) {
		UUID ownerId = owner.currentOwnerId();
		return notes.save(Note.create(ownerId, input.title(), input.body(), input.tags(),
				links.check(ownerId, input.links())));
	}

	public Note update(UUID id, NoteInput input) {
		Note note = get(id);
		note.edit(input.title(), input.body(), input.tags(), links.check(note.ownerId(), input.links()));
		return notes.save(note);
	}

	public void delete(UUID id) {
		notes.delete(get(id));
	}

	@Transactional(readOnly = true)
	public Note get(UUID id) {
		return notes.findById(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Note", id));
	}

	@Transactional(readOnly = true)
	public List<Note> search(String text, String tag) {
		return notes.search(owner.currentOwnerId(), blankToNull(text), blankToNull(tag));
	}

	static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

	public record NoteInput(String title, String body, List<String> tags, KnowledgeLinks links) {
	}

}
