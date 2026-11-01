package com.tbfernandes.api.assistant.infrastructure.model;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Queue;

import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.jayway.jsonpath.JsonPath;
import com.sun.net.httpserver.HttpServer;
import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.StructuredQuery;
import com.tbfernandes.api.assistant.domain.StructuredQuery.Subject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** AST-03: the adapter against the Messages API contract, on a local server instead of Anthropic. */
class AnthropicLanguageModelTest {

	private static final LocalDate TODAY = LocalDate.of(2026, 10, 30);

	private static final String PLAN = """
			{"answerable": %s, "subject": "TASKS", "aggregate": "LIST", "text": "", "statuses": ["todo"], "priorities": [],
			"openOnly": true, "project": "", "company": "Zasso", "dueFrom": "", "dueTo": "%s", "month": "", "sort": "DUE_DATE",
			"limit": 10}""";

	private final List<String> requests = new ArrayList<>();

	private final Queue<String> responses = new ArrayDeque<>();

	private HttpServer server;

	private AnthropicLanguageModel model;

	@BeforeEach
	void startServer() throws IOException {
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/v1/messages", exchange -> {
			requests.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
			byte[] body = responses.remove().getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, body.length);
			exchange.getResponseBody().write(body);
			exchange.close();
		});
		server.start();
		model = new AnthropicLanguageModel(AnthropicOkHttpClient.builder()
			.apiKey("test-key")
			.baseUrl("http://127.0.0.1:" + server.getAddress().getPort())
			.maxRetries(0)
			.build(), "claude-opus-5-5");
	}

	@AfterEach
	void stopServer() {
		model.close();
		server.stop(0);
	}

	@Test
	void asksForTheQueryAsStructuredOutputAndMapsIt() {
		responses.add(message(PLAN.formatted(true, "2026-10-29"), "end_turn"));

		StructuredQuery query = model.toQuery("O que está atrasado na Zasso?", TODAY).orElseThrow();

		assertThat(query.subject()).isEqualTo(Subject.TASKS);
		assertThat(query.statuses()).containsExactly("todo");
		assertThat(query.company()).isEqualTo("Zasso");
		assertThat(query.dueFrom()).isNull();
		assertThat(query.dueTo()).isEqualTo(LocalDate.of(2026, 10, 29));
		assertThat(query.limit()).isEqualTo(10);

		String request = requests.getFirst();
		assertThat((String) JsonPath.read(request, "$.model")).isEqualTo("claude-opus-5-5");
		assertThat((String) JsonPath.read(request, "$.output_config.format.type")).isEqualTo("json_schema");
		assertThat((String) JsonPath.read(request, "$.output_config.effort")).isEqualTo("low");
		assertThat((String) JsonPath.read(request, "$.fallbacks")).isEqualTo("default");
		List<String> subjects = JsonPath.read(request, "$.output_config.format.schema.properties.subject.enum");
		assertThat(subjects).contains("TASKS", "CASH_FLOW");
		assertThat((String) JsonPath.read(request, "$.messages[0].content")).contains("2026-10-30", "atrasado na Zasso");
	}

	@Test
	void aQuestionNoLookupAnswersHasNoQuery() {
		responses.add(message(PLAN.formatted(false, ""), "end_turn"));

		assertThat(model.toQuery("Bom dia!", TODAY)).isEmpty();
	}

	@Test
	void aRefusalHasNoAnswer() {
		responses.add(message("{\"text\": \"\"}", "refusal"));

		assertThat(model.answer("Pergunta", new Answer("Texto", List.of(), "rules"))).isEmpty();
	}

	@Test
	void anInvalidDateFailsSoTheServiceFallsBackToTheRules() {
		responses.add(message(PLAN.formatted(true, "ontem"), "end_turn"));

		assertThatThrownBy(() -> model.toQuery("O que está atrasado?", TODAY)).isInstanceOf(RuntimeException.class);
	}

	@Test
	void onlyTheQuestionAndTheAnswerTextAreSentForTheRewrite() {
		responses.add(message("{\"text\": \"Você tem 2 tarefas.\"}", "end_turn"));

		Optional<String> text = model.answer("Quantas?", new Answer("2 tarefas", List.of(), "query"));

		assertThat(text).contains("Você tem 2 tarefas.");
		assertThat((String) JsonPath.read(requests.getFirst(), "$.messages[0].content")).isEqualTo(
				"Question: Quantas?\n\nAnswer to rewrite:\n2 tarefas");
	}

	private static String message(String text, String stopReason) {
		String escaped = text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
		return """
				{"id": "msg_1", "type": "message", "role": "assistant", "model": "claude-opus-5-5",
				"content": [{"type": "text", "text": "%s"}], "stop_reason": "%s", "stop_sequence": null,
				"usage": {"input_tokens": 1, "output_tokens": 1}}""".formatted(escaped, stopReason);
	}

}
