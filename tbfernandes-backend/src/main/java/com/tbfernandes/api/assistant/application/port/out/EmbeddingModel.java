package com.tbfernandes.api.assistant.application.port.out;

import java.util.List;

/**
 * Output port for the embedding provider (AST-04). Turns passages and questions into vectors,
 * so retrieval finds passages that mean the same with other words. Only the text of notes,
 * snippets and the question leaves the application.
 */
public interface EmbeddingModel {

	/** Stored with every vector, so changing the model embeds the documents again. "none" when off. */
	String name();

	boolean enabled();

	/** One vector per text, in the same order. */
	List<float[]> embedDocuments(List<String> texts);

	float[] embedQuery(String question);

}
