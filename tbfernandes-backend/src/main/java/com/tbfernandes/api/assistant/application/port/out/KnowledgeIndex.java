package com.tbfernandes.api.assistant.application.port.out;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.tbfernandes.api.assistant.domain.IndexedChunk;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument;

/**
 * Output port for the retrieval index (AST-04): the passages of each owner's notes and snippets,
 * with their embeddings. It is derived data, rebuilt from the knowledge module at any time.
 */
public interface KnowledgeIndex {

	/** The fingerprint each indexed document had when it was indexed. */
	Map<KnowledgeDocument.Key, String> fingerprints(UUID ownerId);

	/** Replaces every passage of the document. */
	void replace(UUID ownerId, KnowledgeDocument.Key document, String fingerprint, String embeddingModel,
			List<IndexedChunk> chunks);

	void remove(UUID ownerId, Collection<KnowledgeDocument.Key> documents);

	List<IndexedChunk> chunks(UUID ownerId);

}
