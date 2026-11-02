package com.tbfernandes.api.knowledge.protocols;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.snippet.Snippet;
import com.tbfernandes.api.knowledge.domain.snippet.SnippetDetails;

public record SnippetResponse(UUID id, String title, String language, String code, String explanation,
		String sourceUrl, List<String> tags, List<UUID> projectIds, List<UUID> taskIds, Instant createdAt,
		Instant updatedAt) {

	public static SnippetResponse from(Snippet snippet) {
		SnippetDetails d = snippet.details();
		return new SnippetResponse(snippet.id(), d.title(), d.language(), d.code(), d.explanation(),
				d.sourceUrl(), d.tags(), Sorted.ids(snippet.links().projectIds()),
				Sorted.ids(snippet.links().taskIds()), snippet.createdAt(), snippet.updatedAt());
	}

}
