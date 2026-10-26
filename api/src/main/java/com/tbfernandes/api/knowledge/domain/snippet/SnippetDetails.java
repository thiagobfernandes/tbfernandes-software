package com.tbfernandes.api.knowledge.domain.snippet;

import java.util.List;

public record SnippetDetails(String title, String language, String code, String explanation, String sourceUrl,
		List<String> tags) {
}
