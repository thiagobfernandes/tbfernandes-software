package com.tbfernandes.api.assistant;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.ApiTestSupport;
import com.tbfernandes.api.assistant.application.port.out.LanguageModel;
import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.Passage;
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
		fake.fromPassages = Optional.empty();
		fake.passages = List.of();
	}

	@Test
	void answersAnOpenQuestionFromTheNotesAndCitesThem() {
		String word = "zq" + UUID.randomUUID().toString().substring(0, 8);
		String noteId = create("/api/v1/notes", """
				{"title": "Deploy %s", "body": "Rode o script deploy-%s.sh depois do build."}""".formatted(word, word));
		fake.fromPassages = Optional.of("Rode o script depois do build [1].");

		var answer = post("/api/v1/assistant/questions", "{\"question\": \"Explique o deploy %s\"}".formatted(word));

		assertThat(answer).hasStatusOk();
		assertThat(answer).bodyJson()
			.hasPathSatisfying("$.source", source -> assertThat(source).isEqualTo("rag"))
			.hasPathSatisfying("$.text", text -> assertThat(text).isEqualTo("Rode o script depois do build [1]."));
		List<String> hrefs = read(answer, "$.references[*].href");
		assertThat(hrefs).containsExactly("/knowledge?note=" + noteId);
		List<String> excerpts = read(answer, "$.references[*].excerpt");
		assertThat(excerpts.getFirst()).contains("deploy-" + word + ".sh");
		assertThat(fake.passages).extracting(Passage::title).containsExactly("Deploy " + word);
	}

	@Test
	void aFailingModelAnswersWithThePassages() {
		String word = "zq" + UUID.randomUUID().toString().substring(0, 8);
		create("/api/v1/notes", """
				{"title": "Backup %s", "body": "Copie a pasta pg."}""".formatted(word));
		fake.failing = true;

		var answer = post("/api/v1/assistant/questions", "{\"question\": \"Explique o backup %s\"}".formatted(word));

		assertThat(answer).hasStatusOk();
		assertThat(answer).bodyJson()
			.hasPathSatisfying("$.source", source -> assertThat(source).isEqualTo("search"))
			.hasPathSatisfying("$.references[0].excerpt", excerpt -> assertThat(excerpt).isEqualTo("Copie a pasta pg."));
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

		Optional<String> fromPassages = Optional.empty();

		List<Passage> passages = List.of();

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

		@Override
		public Optional<String> answerFromPassages(String question, List<Passage> found) {
			if (failing) {
				throw new IllegalStateException("Provider down");
			}
			passages = found;
			return fromPassages;
		}

	}

}
