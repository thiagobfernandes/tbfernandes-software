package com.tbfernandes.api.knowledge.application;

import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import com.tbfernandes.api.shared.domain.NotFound;
import com.tbfernandes.api.work.WorkLookup;
import org.springframework.stereotype.Component;

/** RN-05: links must point to projects and tasks of the same owner. */
@Component
class LinkValidator {

	private final WorkLookup work;

	LinkValidator(WorkLookup work) {
		this.work = work;
	}

	KnowledgeLinks check(UUID ownerId, KnowledgeLinks links) {
		if (links == null) {
			return KnowledgeLinks.none();
		}
		links.projectIds().stream().filter(id -> !work.projectExists(ownerId, id)).findFirst().ifPresent(id -> {
			throw new NotFound("Project", id);
		});
		links.taskIds().stream().filter(id -> !work.taskExists(ownerId, id)).findFirst().ifPresent(id -> {
			throw new NotFound("Task", id);
		});
		return links;
	}

}
