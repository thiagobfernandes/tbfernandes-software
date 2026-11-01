package com.tbfernandes.api.assistant;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.ApiTestSupport;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AssistantApiIntegrationTests extends ApiTestSupport {

	@Test
	void answersAboutAProjectWithLinksToRealRecords() {
		String name = "Assistant " + UUID.randomUUID().toString().substring(0, 8);
		String companyId = create("/api/v1/companies", """
				{"name": "Acme %s", "relationship": "client", "startDate": "2026-01-01"}""".formatted(name));
		String projectId = create("/api/v1/projects", """
				{"name": "%s", "companyId": "%s", "category": "professional", "status": "active", "startDate": "2026-01-01"}"""
			.formatted(name, companyId));
		create("/api/v1/tasks", """
				{"title": "Draft the contract", "projectId": "%s"}""".formatted(projectId));
		String noteId = create("/api/v1/notes", """
				{"title": "Scope of %s", "body": "Only phase 1", "projectIds": ["%s"]}""".formatted(name, projectId));

		var answer = post("/api/v1/assistant/questions", """
				{"question": "What about %s?"}""".formatted(name.toLowerCase()));
		assertThat(answer).hasStatusOk();
		assertThat(answer).bodyJson()
			.hasPathSatisfying("$.source", source -> assertThat(source).isEqualTo("rules"))
			.hasPathSatisfying("$.text", text -> assertThat(text).asString().contains("0 de 1 tarefas concluídas"));
		List<String> hrefs = read(answer, "$.references[*].href");
		assertThat(hrefs).contains("/projects/view?id=" + projectId, "/knowledge?note=" + noteId);

		var graph = get("/api/v1/graph");
		assertThat(graph).hasStatusOk();
		List<String> edges = read(graph, "$.edges[?(@.source == 'note:%s')].target".formatted(noteId));
		assertThat(edges).containsExactly("project:" + projectId);
		List<String> kinds = read(graph, "$.nodes[?(@.id == 'company:%s')].kind".formatted(companyId));
		assertThat(kinds).containsExactly("company");
	}

	@Test
	void goalProgressComesFromMilestones() {
		String name = "Goal " + UUID.randomUUID().toString().substring(0, 8);
		String goalId = create("/api/v1/goals", """
				{"name": "%s", "area": "career", "status": "active", "desiredResult": "Done"}""".formatted(name));
		create("/api/v1/milestones", """
				{"goalId": "%s", "title": "First", "done": true}""".formatted(goalId));
		create("/api/v1/milestones", """
				{"goalId": "%s", "title": "Second"}""".formatted(goalId));

		var answer = post("/api/v1/assistant/questions", "{\"question\": \"How are my goals?\"}");
		assertThat(answer).bodyJson()
			.hasPathSatisfying("$.text",
					text -> assertThat(text).asString().contains("- **%s**: 50%% (1/2 marcos)".formatted(name)));
	}

	@Test
	void questionIsRequired() {
		assertThat(post("/api/v1/assistant/questions", "{\"question\": \"  \"}")).hasStatus(400);
	}

}
