package com.tbfernandes.api.knowledge.infrastructure.persistence;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** One row of note_link / snippet_link. */
@Embeddable
record LinkEmbeddable(@Column(name = "target_type") String targetType, @Column(name = "target_id") UUID targetId) {

	static Set<LinkEmbeddable> from(KnowledgeLinks links) {
		Set<LinkEmbeddable> rows = new HashSet<>();
		links.projectIds().forEach(id -> rows.add(new LinkEmbeddable("PROJECT", id)));
		links.taskIds().forEach(id -> rows.add(new LinkEmbeddable("TASK", id)));
		return rows;
	}

	static KnowledgeLinks toLinks(Set<LinkEmbeddable> rows) {
		Set<UUID> projects = new HashSet<>();
		Set<UUID> tasks = new HashSet<>();
		rows.forEach(row -> ("PROJECT".equals(row.targetType()) ? projects : tasks).add(row.targetId()));
		return new KnowledgeLinks(projects, tasks);
	}

}
