package com.tbfernandes.api.knowledge.application;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.KnowledgeLookup;
import com.tbfernandes.api.knowledge.domain.note.NoteRepository;
import com.tbfernandes.api.knowledge.domain.snippet.SnippetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implements the knowledge module's public API on top of its own ports. */
@Service
@Transactional(readOnly = true)
class KnowledgeLookupService implements KnowledgeLookup {

	private final NoteRepository notes;
	private final SnippetRepository snippets;

	KnowledgeLookupService(NoteRepository notes, SnippetRepository snippets) {
		this.notes = notes;
		this.snippets = snippets;
	}

	@Override
	public List<NoteView> notes(UUID ownerId) {
		return notes.search(ownerId, null, null)
			.stream()
			.map(n -> new NoteView(n.id(), n.title(), n.body(), n.tags(), n.links().projectIds(),
					n.links().taskIds()))
			.toList();
	}

	@Override
	public List<SnippetView> snippets(UUID ownerId) {
		return snippets.search(ownerId, null, null, null).stream().map(s -> {
			var d = s.details();
			return new SnippetView(s.id(), d.title(), d.explanation(), d.tags(), s.links().projectIds(),
					s.links().taskIds());
		}).toList();
	}

}
