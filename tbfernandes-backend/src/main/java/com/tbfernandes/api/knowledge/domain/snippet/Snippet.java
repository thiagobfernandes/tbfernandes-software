package com.tbfernandes.api.knowledge.domain.snippet;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import com.tbfernandes.api.knowledge.domain.Tags;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/**
 * A code snippet (RF-KNW-02). The code is kept exactly as entered, never trimmed or
 * executed (RN-11).
 */
public final class Snippet {

	private final UUID id;
	private final UUID ownerId;
	private SnippetDetails details;
	private KnowledgeLinks links;
	private Instant createdAt;
	private Instant updatedAt;

	private Snippet(UUID id, UUID ownerId) {
		this.id = id;
		this.ownerId = ownerId;
	}

	public static Snippet create(UUID ownerId, SnippetDetails details, KnowledgeLinks links) {
		Snippet snippet = new Snippet(Ids.forNewAggregate(), Require.present(ownerId, "ownerId"));
		snippet.edit(details, links);
		return snippet;
	}

	public static Snippet restore(UUID id, UUID ownerId, SnippetDetails details, KnowledgeLinks links,
			Instant createdAt, Instant updatedAt) {
		Snippet snippet = new Snippet(id, ownerId);
		snippet.details = details;
		snippet.links = links;
		snippet.createdAt = createdAt;
		snippet.updatedAt = updatedAt;
		return snippet;
	}

	public void edit(SnippetDetails d, KnowledgeLinks links) {
		if (d.code() == null || d.code().isBlank()) {
			throw new IllegalArgumentException("code is required");
		}
		this.details = new SnippetDetails(Require.text(d.title(), "title", 200),
				Require.text(d.language(), "language", 30).toLowerCase(), d.code(),
				Require.optionalText(d.explanation(), "explanation", 5000),
				Require.optionalText(d.sourceUrl(), "sourceUrl", 2000), Tags.normalize(d.tags()));
		this.links = links == null ? KnowledgeLinks.none() : links;
	}

	public boolean unlink(UUID workItemId) {
		KnowledgeLinks next = links.without(workItemId);
		boolean changed = !next.equals(links);
		links = next;
		return changed;
	}

	public UUID id() {
		return id;
	}

	public UUID ownerId() {
		return ownerId;
	}

	public SnippetDetails details() {
		return details;
	}

	public KnowledgeLinks links() {
		return links;
	}

	public Instant createdAt() {
		return createdAt;
	}

	public Instant updatedAt() {
		return updatedAt;
	}

}
