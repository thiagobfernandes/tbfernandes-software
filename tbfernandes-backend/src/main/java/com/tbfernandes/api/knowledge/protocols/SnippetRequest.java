package com.tbfernandes.api.knowledge.protocols;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.KnowledgeLinks;
import com.tbfernandes.api.knowledge.domain.snippet.SnippetDetails;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SnippetRequest(@NotBlank @Size(max = 200) String title, @NotBlank @Size(max = 30) String language,
		@NotBlank String code, @Size(max = 5000) String explanation, @Size(max = 2000) String sourceUrl,
		List<String> tags, Set<UUID> projectIds, Set<UUID> taskIds) {

	public SnippetDetails details() {
		return new SnippetDetails(title, language, code, explanation, sourceUrl, tags);
	}

	public KnowledgeLinks links() {
		return new KnowledgeLinks(projectIds, taskIds);
	}

}
