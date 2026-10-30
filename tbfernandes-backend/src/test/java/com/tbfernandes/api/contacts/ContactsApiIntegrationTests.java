package com.tbfernandes.api.contacts;

import java.time.LocalDate;
import java.util.List;

import com.tbfernandes.api.ApiTestSupport;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ContactsApiIntegrationTests extends ApiTestSupport {

	@Test
	void companyReferenceRules() {
		assertThat(post("/api/v1/contacts", """
				{"name": "Ana", "companyId": "0192f000-0000-7000-8000-00000000dead"}""")).hasStatus(404);

		String companyId = create("/api/v1/companies", """
				{"name": "Acme", "relationship": "client", "startDate": "2026-01-01"}""");
		assertThat(post("/api/v1/contacts", """
				{"name": "Ana", "companyId": "%s", "companyName": "Acme Inc"}""".formatted(companyId)))
			.hasStatus(422);

		String contactId = create("/api/v1/contacts", """
				{"name": "Ana", "companyId": "%s", "email": "Ana@Acme.com", "specialties": ["Java", " Java", "SQL"]}"""
			.formatted(companyId));
		assertThat(get("/api/v1/contacts/{id}", contactId)).bodyJson()
			.hasPathSatisfying("$.email", email -> assertThat(email).isEqualTo("ana@acme.com"))
			.extractingPath("$.specialties")
			.asArray()
			.containsExactly("Java", "SQL");

		assertThat(mvc.delete().uri("/api/v1/companies/{id}", companyId)).hasStatus(204);
		eventually(() -> read(get("/api/v1/contacts/{id}", contactId), "$.companyId") == null);
	}

	@Test
	void followUpCreatesATaskOnceAndIsClearedWhenTheTaskIsDeleted() {
		String contactId = create("/api/v1/contacts", """
				{"name": "Bruno", "nextContact": "%s"}""".formatted(LocalDate.now().plusDays(3)));
		String interactionId = create("/api/v1/interactions", """
				{"contactId": "%s", "date": "2026-10-20", "kind": "meeting", "summary": "Talked about the API"}"""
			.formatted(contactId));

		var followed = post("/api/v1/interactions/" + interactionId + "/follow-up", "{\"dueDate\": \"2026-11-01\"}");
		assertThat(followed).hasStatusOk();
		String taskId = read(followed, "$.followUpTaskId");
		assertThat(get("/api/v1/tasks/{id}", taskId)).bodyJson()
			.hasPathSatisfying("$.title", title -> assertThat(title).isEqualTo("Follow-up com Bruno"));
		assertThat(post("/api/v1/interactions/" + interactionId + "/follow-up", "{}")).hasStatus(422);

		List<String> due = read(get("/api/v1/contacts?dueWithinDays=7"), "$[*].id");
		assertThat(due).contains(contactId);

		assertThat(mvc.delete().uri("/api/v1/tasks/{id}", taskId)).hasStatus(204);
		eventually(() -> read(get("/api/v1/interactions?contactId=" + contactId), "$[0].followUpTaskId") == null);
	}

	@Test
	void deletingAContactDeletesItsInteractions() {
		String contactId = create("/api/v1/contacts", "{\"name\": \"Carla\"}");
		create("/api/v1/interactions", """
				{"contactId": "%s", "date": "2026-10-20", "kind": "call", "summary": "Intro"}""".formatted(contactId));

		assertThat(mvc.delete().uri("/api/v1/contacts/{id}", contactId)).hasStatus(204);
		List<String> left = read(get("/api/v1/interactions?contactId=" + contactId), "$[*].id");
		assertThat(left).isEmpty();
	}

}
