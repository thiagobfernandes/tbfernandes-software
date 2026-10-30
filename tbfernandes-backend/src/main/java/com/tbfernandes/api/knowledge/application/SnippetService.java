package com.tbfernandes.api.knowledge.application;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import com.tbfernandes.api.knowledge.domain.snippet.Snippet;
import com.tbfernandes.api.knowledge.domain.snippet.SnippetDetails;
import com.tbfernandes.api.knowledge.domain.snippet.SnippetRepository;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.NotFound;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.tbfernandes.api.knowledge.application.NoteService.blankToNull;

/** Snippet use cases (RF-KNW-02..04). */
@Service
@Transactional
public class SnippetService {

	private final SnippetRepository snippets;
	private final LinkValidator links;
	private final OwnerContext owner;

	SnippetService(SnippetRepository snippets, LinkValidator links, OwnerContext owner) {
		this.snippets = snippets;
		this.links = links;
		this.owner = owner;
	}

	public Snippet create(SnippetDetails details, KnowledgeLinks linksIn) {
		UUID ownerId = owner.currentOwnerId();
		return snippets.save(Snippet.create(ownerId, details, links.check(ownerId, linksIn)));
	}

	public Snippet update(UUID id, SnippetDetails details, KnowledgeLinks linksIn) {
		Snippet snippet = get(id);
		snippet.edit(details, links.check(snippet.ownerId(), linksIn));
		return snippets.save(snippet);
	}

	public void delete(UUID id) {
		snippets.delete(get(id));
	}

	@Transactional(readOnly = true)
	public Snippet get(UUID id) {
		return snippets.findById(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Snippet", id));
	}

	@Transactional(readOnly = true)
	public List<Snippet> search(String text, String language, String tag) {
		String lang = blankToNull(language);
		return snippets.search(owner.currentOwnerId(), blankToNull(text), lang == null ? null : lang.toLowerCase(),
				blankToNull(tag));
	}

}
