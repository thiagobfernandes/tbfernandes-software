package com.tbfernandes.api.knowledge.domain.note;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import com.tbfernandes.api.knowledge.domain.Tags;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** A Markdown note (RF-KNW-01). createdAt/updatedAt come from persistence. */
public final class Note {

	private final UUID id;
	private final UUID ownerId;
	private String title;
	private String body;
	private List<String> tags;
	private KnowledgeLinks links;
	private Instant createdAt;
	private Instant updatedAt;

	private Note(UUID id, UUID ownerId) {
		this.id = id;
		this.ownerId = ownerId;
	}

	public static Note create(UUID ownerId, String title, String body, List<String> tags, KnowledgeLinks links) {
		Note note = new Note(Ids.newId(), Require.present(ownerId, "ownerId"));
		note.edit(title, body, tags, links);
		return note;
	}

	public static Note restore(UUID id, UUID ownerId, String title, String body, List<String> tags,
			KnowledgeLinks links, Instant createdAt, Instant updatedAt) {
		Note note = new Note(id, ownerId);
		note.title = title;
		note.body = body;
		note.tags = List.copyOf(tags);
		note.links = links;
		note.createdAt = createdAt;
		note.updatedAt = updatedAt;
		return note;
	}

	public void edit(String title, String body, List<String> tags, KnowledgeLinks links) {
		this.title = Require.text(title, "title", 200);
		this.body = body == null ? "" : body;
		this.tags = Tags.normalize(tags);
		this.links = links == null ? KnowledgeLinks.none() : links;
	}

	/** Drops a link to a deleted work item (KNW-06). Returns true if something changed. */
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

	public String title() {
		return title;
	}

	public String body() {
		return body;
	}

	public List<String> tags() {
		return tags;
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
