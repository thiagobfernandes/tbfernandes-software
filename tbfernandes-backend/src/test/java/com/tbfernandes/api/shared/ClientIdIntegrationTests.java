package com.tbfernandes.api.shared;

import java.util.UUID;

import com.tbfernandes.api.ApiTestSupport;
import com.tbfernandes.api.shared.domain.Ids;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import static org.assertj.core.api.Assertions.assertThat;

/** ADR-007: the frontend may choose the id of the record it creates. */
class ClientIdIntegrationTests extends ApiTestSupport {

	private MvcTestResult postWithId(String uri, String id, String json) {
		return mvc.post()
			.uri(uri)
			.header("X-Client-Id", id)
			.contentType(MediaType.APPLICATION_JSON)
			.content(json)
			.exchange();
	}

	@Test
	void createUsesTheClientIdOnce() {
		String id = Ids.newId().toString();
		String company = """
				{"name": "Client id %s", "relationship": "client", "startDate": "2026-01-01"}""".formatted(id);

		MvcTestResult created = postWithId("/api/v1/companies", id, company);
		assertThat(created).hasStatus(201);
		assertThat((String) read(created, "$.id")).isEqualTo(id);

		// The same id again would overwrite the company: refused, and the first one is intact.
		assertThat(postWithId("/api/v1/companies", id, company.replace("Client id", "Other"))).hasStatus(409);
		assertThat((String) read(get("/api/v1/companies/{id}", id), "$.name")).startsWith("Client id");
	}

	@Test
	void childRecordsKeepServerIds() {
		String id = UUID.randomUUID().toString();
		MvcTestResult task = postWithId("/api/v1/tasks", id, """
				{"title": "With checklist", "checklistItems": [{"title": "a"}, {"title": "b"}]}""");
		assertThat(task).hasStatus(201);
		assertThat((String) read(task, "$.id")).isEqualTo(id);
		assertThat((String) read(task, "$.checklistItems[0].id")).isNotEqualTo(id);
	}

	@Test
	void invalidHeaderIsRejected() {
		assertThat(postWithId("/api/v1/companies", "not-a-uuid", "{}")).hasStatus(400);
	}

}
