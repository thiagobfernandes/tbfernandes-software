package com.tbfernandes.api.assistant.adapter.out.embedding;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import com.jayway.jsonpath.JsonPath;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** AST-04: the adapter against the Voyage embeddings contract, on a local server. */
class VoyageEmbeddingModelTest {

	private final List<String> requests = new ArrayList<>();

	private final List<String> authorizations = new ArrayList<>();

	private String response;

	private HttpServer server;

	private VoyageEmbeddingModel model;

	@BeforeEach
	void startServer() throws IOException {
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/v1/embeddings", exchange -> {
			requests.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
			authorizations.add(exchange.getRequestHeaders().getFirst("Authorization"));
			byte[] body = response.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, body.length);
			exchange.getResponseBody().write(body);
			exchange.close();
		});
		server.start();
		model = new VoyageEmbeddingModel(RestClient.builder(), "voyage-3.5-lite", "test-key",
				"http://127.0.0.1:" + server.getAddress().getPort());
	}

	@AfterEach
	void stopServer() {
		server.stop(0);
	}

	@Test
	void embedsDocumentsInTheOrderOfTheirIndex() {
		response = """
				{"object": "list", "model": "voyage-3.5-lite", "usage": {"total_tokens": 4}, "data": [
				{"object": "embedding", "index": 1, "embedding": [0.3, 0.4]},
				{"object": "embedding", "index": 0, "embedding": [0.1, 0.2]}]}""";

		List<float[]> vectors = model.embedDocuments(List.of("primeiro", "segundo"));

		assertThat(vectors).containsExactly(new float[] { 0.1f, 0.2f }, new float[] { 0.3f, 0.4f });
		String request = requests.getFirst();
		assertThat((String) JsonPath.read(request, "$.model")).isEqualTo("voyage-3.5-lite");
		assertThat((String) JsonPath.read(request, "$.input_type")).isEqualTo("document");
		assertThat((List<String>) JsonPath.read(request, "$.input")).containsExactly("primeiro", "segundo");
		assertThat(authorizations).containsExactly("Bearer test-key");
		assertThat(model.name()).isEqualTo("voyage:voyage-3.5-lite");
	}

	@Test
	void embedsTheQuestionAsAQuery() {
		response = """
				{"data": [{"index": 0, "embedding": [1.0, 0.0]}]}""";

		assertThat(model.embedQuery("como instalei o docker?")).containsExactly(1.0f, 0.0f);
		assertThat((String) JsonPath.read(requests.getFirst(), "$.input_type")).isEqualTo("query");
	}

	@Test
	void failsWhenVectorsAreMissing() {
		response = """
				{"data": []}""";

		assertThatThrownBy(() -> model.embedDocuments(List.of("texto"))).isInstanceOf(IllegalStateException.class);
	}

	@Test
	void needsAnApiKey() {
		assertThatThrownBy(() -> new VoyageEmbeddingModel(RestClient.builder(), "voyage-3.5-lite", "", "http://x"))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("VOYAGE_API_KEY");
	}

}
