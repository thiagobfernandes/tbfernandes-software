package com.tbfernandes.api.knowledge;

import java.util.List;

import com.tbfernandes.api.ApiTestSupport;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class KnowledgeApiIntegrationTests extends ApiTestSupport {

	@Test
	void noteIsFoundByTextAndTagAndLosesTheLinkWhenTheProjectIsDeleted() {
		String projectId = create("/api/v1/projects", """
				{"name": "Knowledge base", "category": "study", "startDate": "2026-10-01"}""");
		String noteId = create("/api/v1/notes", """
				{"title": "Flyway naming", "body": "Versioned migrations never change after release.",
				 "tags": ["Database", " flyway "], "projectIds": ["%s"]}""".formatted(projectId));

		assertThat(get("/api/v1/notes/{id}", noteId)).bodyJson()
			.extractingPath("$.tags")
			.asArray()
			.containsExactly("database", "flyway");
		List<String> byText = read(get("/api/v1/notes?q=migrations"), "$[*].id");
		List<String> byTag = read(get("/api/v1/notes?tag=flyway"), "$[*].id");
		assertThat(byText).contains(noteId);
		assertThat(byTag).contains(noteId);

		assertThat(mvc.delete().uri("/api/v1/projects/{id}", projectId)).hasStatus(204);
		eventually(() -> read(get("/api/v1/notes/{id}", noteId), "$.projectIds").toString().equals("[]"));
	}

	@Test
	void linkToAnUnknownTaskIsRejected() {
		assertThat(post("/api/v1/notes", """
				{"title": "Orphan", "taskIds": ["0192f000-0000-7000-8000-00000000dead"]}""")).hasStatus(404);
	}

	@Test
	void snippetCodeIsStoredVerbatim() {
		String code = "  if (x) {\\n\\treturn y;\\n  }\\n";
		String id = create("/api/v1/snippets", """
				{"title": "Guard", "language": "Java", "code": "%s"}""".formatted(code));

		assertThat(get("/api/v1/snippets/{id}", id)).bodyJson()
			.hasPathSatisfying("$.code", value -> assertThat(value).isEqualTo("  if (x) {\n\treturn y;\n  }\n"))
			.hasPathSatisfying("$.language", value -> assertThat(value).isEqualTo("java"));
		List<String> javaSnippets = read(get("/api/v1/snippets?language=java&q=guard"), "$[*].id");
		assertThat(javaSnippets).contains(id);
	}

	@Test
	void methodKeepsStepOrder() {
		String id = create("/api/v1/methods", """
				{"title": "Code review", "summary": "How I review", "category": "quality",
				 "steps": [{"title": "Read the ticket"}, {"title": "Run it"}, {"title": "Comment", "detail": "kindly"}],
				 "examples": [{"title": "Comment", "content": "nit: rename"}],
				 "lastReviewed": "2026-10-20"}""");

		assertThat(get("/api/v1/methods/{id}", id)).bodyJson()
			.extractingPath("$.steps[*].title")
			.asArray()
			.containsExactly("Read the ticket", "Run it", "Comment");
		assertThat(post("/api/v1/methods", """
				{"title": "Empty", "summary": "x", "category": "quality", "steps": [], "lastReviewed": "2026-10-20"}"""))
			.hasStatus(400);
	}

}
