package com.tbfernandes.api.assistant.domain;

/**
 * One passage of a document in the retrieval index (AST-04). {@code vector} is its embedding, or
 * null when no embedding model is configured or the model could not be reached; such passages
 * are still found by their words.
 */
public record IndexedChunk(KnowledgeDocument.Key source, int position, String title, String text, float[] vector) {
}
