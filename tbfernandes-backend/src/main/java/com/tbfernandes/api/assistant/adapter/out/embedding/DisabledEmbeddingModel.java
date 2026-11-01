package com.tbfernandes.api.assistant.adapter.out.embedding;

import java.util.List;

import com.tbfernandes.api.assistant.application.port.out.EmbeddingModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Default adapter (AST-04): no embeddings, so retrieval finds passages by their words only. */
@Component
@ConditionalOnProperty(prefix = "tbf.assistant.embedding", name = "provider", havingValue = "none", matchIfMissing = true)
class DisabledEmbeddingModel implements EmbeddingModel {

	@Override
	public String name() {
		return "none";
	}

	@Override
	public boolean enabled() {
		return false;
	}

	@Override
	public List<float[]> embedDocuments(List<String> texts) {
		throw new UnsupportedOperationException("No embedding model is configured");
	}

	@Override
	public float[] embedQuery(String question) {
		throw new UnsupportedOperationException("No embedding model is configured");
	}

}
