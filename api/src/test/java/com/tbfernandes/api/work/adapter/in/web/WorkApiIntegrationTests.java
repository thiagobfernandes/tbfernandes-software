package com.tbfernandes.api.work.adapter.in.web;

import java.io.UnsupportedEncodingException;

import com.jayway.jsonpath.JsonPath;
import com.tbfernandes.api.TestcontainersConfiguration;
import com.tbfernandes.api.work.TaskCompleted;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import static org.assertj.core.api.Assertions.assertThat;

/** End to end through HTTP, use cases and PostgreSQL, with the JSON shape the frontend expects. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@RecordApplicationEvents
class WorkApiIntegrationTests {

	@Autowired
	MockMvcTester mvc;

	@Autowired
	ApplicationEvents events;

	@Test
	void companyProjectAndTaskLifecycle() {
		String companyId = idOf(post("/api/v1/companies", """
				{"name": "Software house", "relationship": "contractor", "startDate": "2025-03-10"}"""));

		String projectId = idOf(post("/api/v1/projects", """
				{"name": "Telemetry support", "companyId": "%s", "category": "professional",
				 "status": "active", "startDate": "2026-09-01"}""".formatted(companyId)));

		MvcTestResult created = post("/api/v1/tasks", """
				{"title": "Investigate ingestion alert", "projectId": "%s", "status": "in_progress",
				 "priority": "urgent", "checklist": {"done": 2, "total": 5}}""".formatted(projectId));
		assertThat(created).hasStatus(201)
			.bodyJson()
			.hasPathSatisfying("$.status", status -> assertThat(status).isEqualTo("in_progress"))
			.hasPathSatisfying("$.checklist.total", total -> assertThat(total).isEqualTo(5));
		String taskId = idOf(created);

		assertThat(mvc.patch()
			.uri("/api/v1/tasks/{id}/status", taskId)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"status\": \"done\"}")).hasStatusOk().bodyJson().extractingPath("$.completedAt").isNotNull();
		assertThat(events.stream(TaskCompleted.class)).hasSize(1);

		assertThat(mvc.get().uri("/api/v1/tasks?projectId={id}&status=done", projectId)).hasStatusOk()
			.bodyJson()
			.extractingPath("$.length()")
			.isEqualTo(1);
	}

	@Test
	void invalidRequestReturnsProblemDetailsWithFieldErrors() {
		assertThat(post("/api/v1/companies", "{\"relationship\": \"client\"}")).hasStatus(400)
			.bodyJson()
			.hasPathSatisfying("$.errors.name", errors -> assertThat(errors).isNotNull());
	}

	@Test
	void closedCompanyCannotTakeAnActiveProject() {
		String companyId = idOf(post("/api/v1/companies", """
				{"name": "Previous agency", "relationship": "client", "status": "closed", "startDate": "2023-02-01"}"""));

		assertThat(post("/api/v1/projects", """
				{"name": "Revival", "companyId": "%s", "category": "professional", "status": "active",
				 "startDate": "2026-10-01"}""".formatted(companyId))).hasStatus(422)
			.bodyJson()
			.hasPathSatisfying("$.rule", rule -> assertThat(rule).isEqualTo("RN-03"));
	}

	@Test
	void companyWithProjectsCannotBeDeletedButAnEmptyOneCan() {
		String busy = idOf(post("/api/v1/companies", """
				{"name": "Busy", "relationship": "client", "startDate": "2026-01-01"}"""));
		idOf(post("/api/v1/projects", """
				{"name": "P", "companyId": "%s", "category": "personal", "startDate": "2026-01-01"}""".formatted(busy)));
		String empty = idOf(post("/api/v1/companies", """
				{"name": "Empty", "relationship": "client", "startDate": "2026-01-01"}"""));

		assertThat(mvc.delete().uri("/api/v1/companies/{id}", busy)).hasStatus(409)
			.bodyJson()
			.hasPathSatisfying("$.rule", rule -> assertThat(rule).isEqualTo("RN-01"));
		assertThat(mvc.delete().uri("/api/v1/companies/{id}", empty)).hasStatus(204);
		assertThat(mvc.get().uri("/api/v1/companies/{id}", empty)).hasStatus(404);
	}

	@Test
	void deletingAProjectKeepsItsTasksWithoutProject() {
		String projectId = idOf(post("/api/v1/projects", """
				{"name": "Short lived", "category": "personal", "startDate": "2026-01-01"}"""));
		String taskId = idOf(post("/api/v1/tasks", """
				{"title": "Survivor", "projectId": "%s"}""".formatted(projectId)));

		assertThat(mvc.delete().uri("/api/v1/projects/{id}", projectId)).hasStatus(204);
		assertThat(mvc.get().uri("/api/v1/tasks/{id}", taskId)).hasStatusOk()
			.bodyJson()
			.hasPathSatisfying("$.projectId", id -> assertThat(id).isNull());
	}

	@Test
	void overdueFilterAndDashboardSummary() {
		idOf(post("/api/v1/tasks", """
				{"title": "Very late", "status": "todo", "dueDate": "2020-01-01"}"""));
		idOf(post("/api/v1/tasks", """
				{"title": "Late but done", "status": "done", "dueDate": "2020-01-01"}"""));

		assertThat(mvc.get().uri("/api/v1/tasks?overdue=true")).hasStatusOk()
			.bodyJson()
			.extractingPath("$[*].title")
			.asArray()
			.contains("Very late")
			.doesNotContain("Late but done");
		assertThat(mvc.get().uri("/api/v1/dashboard/summary")).hasStatusOk()
			.bodyJson()
			.hasPathSatisfying("$.overdueTasks", count -> assertThat(count).asNumber().isNotEqualTo(0));
	}

	private MvcTestResult post(String uri, String json) {
		return mvc.post().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json).exchange();
	}

	private static String idOf(MvcTestResult result) {
		assertThat(result).hasStatus(201);
		try {
			return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
		}
		catch (UnsupportedEncodingException ex) {
			throw new IllegalStateException(ex);
		}
	}

}
