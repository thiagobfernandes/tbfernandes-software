package com.tbfernandes.api.knowledge.domain;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/** Work items a note or snippet relates to (RF-KNW-03). Ids point to the work module. */
public record KnowledgeLinks(Set<UUID> projectIds, Set<UUID> taskIds) {

	public KnowledgeLinks {
		projectIds = projectIds == null ? Set.of() : Set.copyOf(projectIds);
		taskIds = taskIds == null ? Set.of() : Set.copyOf(taskIds);
	}

	/** The same links without a deleted work item (KNW-06). */
	public KnowledgeLinks without(UUID workItemId) {
		Set<UUID> projects = new HashSet<>(projectIds);
		Set<UUID> tasks = new HashSet<>(taskIds);
		projects.remove(workItemId);
		tasks.remove(workItemId);
		return new KnowledgeLinks(projects, tasks);
	}

	public static KnowledgeLinks none() {
		return new KnowledgeLinks(Set.of(), Set.of());
	}

}
