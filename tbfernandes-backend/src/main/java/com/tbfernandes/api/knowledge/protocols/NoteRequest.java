package com.tbfernandes.api.knowledge.protocols;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.knowledge.application.NoteService.NoteInput;
import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoteRequest(@NotBlank @Size(max = 200) String title, String body, List<String> tags,
		Set<UUID> projectIds, Set<UUID> taskIds) {

	public NoteInput toInput() {
		return new NoteInput(title, body, tags, new KnowledgeLinks(projectIds, taskIds));
	}

}
