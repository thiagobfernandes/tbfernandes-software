package com.tbfernandes.api.assistant.adapter.out.embedding;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;

import com.tbfernandes.api.assistant.application.port.out.EmbeddingModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

/**
 * Voyage AI adapter (AST-04), active with tbf.assistant.embedding.provider=voyage. Contract:
 * POST /v1/embeddings with {input, model, input_type}, answered with {data: [{embedding, index}]}.
 * input_type tells the model whether the text is a passage to store or a question to search
 * with, which improves retrieval. https://docs.voyageai.com/reference/embeddings-api
 */
@Component
@ConditionalOnProperty(prefix = "tbf.assistant.embedding", name = "provider", havingValue = "voyage")
class VoyageEmbeddingModel implements EmbeddingModel {

	private final RestClient http;

	private final String model;

	@Autowired
	VoyageEmbeddingModel(RestClient.Builder builder, @Value("${tbf.assistant.embedding.name}") String model,
			@Value("${tbf.assistant.embedding.api-key:}") String apiKey,
			@Value("${tbf.assistant.embedding.base-url:https://api.voyageai.com}") String baseUrl) {
		this(builder.clone()
			.baseUrl(baseUrl)
			.defaultHeader("Authorization", "Bearer " + requireKey(apiKey))
			.requestFactory(requestFactory())
			.build(), model);
	}

	VoyageEmbeddingModel(RestClient http, String model) {
		this.http = http;
		this.model = model;
	}

	private static String requireKey(String apiKey) {
		if (!StringUtils.hasText(apiKey)) {
			throw new IllegalStateException("tbf.assistant.embedding.provider=voyage needs VOYAGE_API_KEY");
		}
		return apiKey;
	}

	private static JdkClientHttpRequestFactory requestFactory() {
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
				HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
		factory.setReadTimeout(Duration.ofSeconds(30));
		return factory;
	}

	@Override
	public String name() {
		return "voyage:" + model;
	}

	@Override
	public boolean enabled() {
		return true;
	}

	@Override
	public List<float[]> embedDocuments(List<String> texts) {
		return embed(texts, "document");
	}

	@Override
	public float[] embedQuery(String question) {
		return embed(List.of(question), "query").getFirst();
	}

	private List<float[]> embed(List<String> texts, String inputType) {
		EmbeddingResponse response = http.post()
			.uri("/v1/embeddings")
			.contentType(MediaType.APPLICATION_JSON)
			.body(new EmbeddingRequest(texts, model, inputType))
			.retrieve()
			.body(EmbeddingResponse.class);
		if (response == null || response.data() == null || response.data().size() != texts.size()) {
			throw new IllegalStateException("Voyage returned no embedding for some of the texts");
		}
		return response.data().stream().sorted(Comparator.comparingInt(Embedding::index)).map(Embedding::embedding).toList();
	}

	record EmbeddingRequest(List<String> input, String model, String input_type) {
	}

	record EmbeddingResponse(List<Embedding> data) {
	}

	record Embedding(int index, float[] embedding) {
	}

}
