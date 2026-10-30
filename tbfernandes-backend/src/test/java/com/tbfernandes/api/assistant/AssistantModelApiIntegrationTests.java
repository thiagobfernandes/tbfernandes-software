package com.tbfernandes.api.assistant;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.ApiTestSupport;
import com.tbfernandes.api.assistant.application.port.out.LanguageModel;
import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.StructuredQuery;
import com.tbfernandes.api.assistant.domain.StructuredQuery.Subject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;

import static org.assertj.core.api.Assertions.assertThat;

/** AST-03: a question goes through a structured query, with a fake model and real data. */
@Import(AssistantModelApiIntegrationTests.FakeModelConfig.class)
class AssistantModelApiIntegrationTests extends ApiTestSupport {

	@Autowired
	FakeModel fake;

	@BeforeEach
	void reset() {
		fake.query = Optional.empty();
		fake.rewrite = Optional.empty();
		fake.failing = false;
	}

	@Test
	void runsTheModelsQueryAndLinksOnlyToRealRecords() {
		String title = "Query " + UUID.randomUUID();
		create("/api/v1/tasks", """
				{"title": "%s"}""".formatted(title));
		fake.query = Optional.of(new StructuredQuery(Subject.TASKS, null, title, List.of(), List.of(), true, "", "", null, null,
				null, null, 0));

		var answer = post("/api/v1/assistant/questions", "{\"question\": \"Quais tarefas?\"}");

		assertThat(answer).hasStatusOk();
		assertThat(answer).bodyJson()
			.hasPathSatisfying("$.source", source -> assertThat(source).isEqualTo("query"))
			.hasPathSatisfying("$.query.subject", subject -> assertThat(subject).isEqualTo("tasks"))
			.hasPathSatisfying("$.text", text -> assertThat(text).asString().contains(title));
		List<String> labels = read(answer, "$.references[*].label");
		assertThat(labels).containsExactly(title);
	}

	@Test
	void theRewrittenTextKeepsTheReferencesOfTheQuery() {
		String title = "Rewrite " + UUID.randomUUID();
		create("/api/v1/tasks", """
				{"title": "%s"}""".formatted(title));
		fake.query = Optional.of(new StructuredQuery(Subject.TASKS, null, title, List.of(), List.of(), false, "", "", null, null,
				null, null, 0));
		fake.rewrite = Optional.of("Texto do modelo");

		var answer = post("/api/v1/assistant/questions", "{\"question\": \"Quais tarefas?\"}");

		assertThat(answer).bodyJson()
			.hasPathSatisfying("$.source", source -> assertThat(source).isEqualTo("model"))
			.hasPathSatisfying("$.text", text -> assertThat(text).isEqualTo("Texto do modelo"));
		List<String> labels = read(answer, "$.references[*].label");
		assertThat(labels).containsExactly(title);
	}

	@Test
	void aFailingModelStillAnswersWithRules() {
		fake.failing = true;

		var answer = post("/api/v1/assistant/questions", "{\"question\": \"Como estão as metas?\"}");

		assertThat(answer).hasStatusOk();
		assertThat(answer).bodyJson().hasPathSatisfying("$.source", source -> assertThat(source).isEqualTo("rules"));
	}

	@TestConfiguration
	static class FakeModelConfig {

		@Bean
		@Primary
		FakeModel fakeModel() {
			return new FakeModel();
		}

	}

	static class FakeModel implements LanguageModel {

		Optional<StructuredQuery> query = Optional.empty();

		Optional<String> rewrite = Optional.empty();

		boolean failing;

		@Override
		public Optional<StructuredQuery> toQuery(String question, LocalDate today) {
			if (failing) {
				throw new IllegalStateException("Provider down");
			}
			return query;
		}

		@Override
		public Optional<String> answer(String question, Answer grounded) {
			if (failing) {
				throw new IllegalStateException("Provider down");
			}
			return rewrite;
		}

	}

}
