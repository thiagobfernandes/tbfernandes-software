package com.tbfernandes.api.assistant.application;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.assistant.application.port.out.EmbeddingModel;
import com.tbfernandes.api.assistant.application.port.out.KnowledgeIndex;
import com.tbfernandes.api.assistant.domain.IndexedChunk;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument;
import com.tbfernandes.api.assistant.domain.Passage;
import com.tbfernandes.api.assistant.domain.PassageRanker;
import com.tbfernandes.api.assistant.domain.TextChunker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Retrieval for the assistant (AST-04). Before each search the index is brought up to date with
 * the notes and snippets passed in: documents whose fingerprint changed are split and embedded
 * again, deleted ones are removed. The embedding calls run outside any transaction. When the
 * provider fails, passages are stored without vectors and found by their words; the next search
 * tries to embed them again.
 */
@Service
public class KnowledgeRetrieval {

	static final int PASSAGES = 6;

	/** Voyage accepts up to 1,000 texts per request; smaller batches keep each request short. */
	static final int BATCH = 64;

	private static final Logger log = LoggerFactory.getLogger(KnowledgeRetrieval.class);

	private static final String NO_MODEL = "none";

	private final KnowledgeIndex index;
	private final EmbeddingModel embeddings;
	private final TransactionTemplate transaction;

	KnowledgeRetrieval(KnowledgeIndex index, EmbeddingModel embeddings, PlatformTransactionManager transactions) {
		this.index = index;
		this.embeddings = embeddings;
		this.transaction = new TransactionTemplate(transactions);
	}

	/** The passages that best answer the question, or an empty list. Never fails. */
	public List<Passage> search(UUID ownerId, String question, List<KnowledgeDocument> documents) {
		try {
			synchronize(ownerId, documents);
			float[] questionVector = null;
			if (embeddings.enabled()) {
				try {
					questionVector = embeddings.embedQuery(question);
				}
				catch (RuntimeException ex) {
					log.warn("Embedding model failed for the question, searching by words", ex);
				}
			}
			return PassageRanker.rank(question, questionVector, index.chunks(ownerId), PASSAGES);
		}
		catch (RuntimeException ex) {
			log.warn("Knowledge retrieval failed", ex);
			return List.of();
		}
	}

	/** One owner at a time, so two questions do not index the same document twice. */
	synchronized void synchronize(UUID ownerId, List<KnowledgeDocument> documents) {
		Map<KnowledgeDocument.Key, String> indexed = index.fingerprints(ownerId);
		String model = embeddings.enabled() ? embeddings.name() : NO_MODEL;

		List<KnowledgeDocument> changed = new ArrayList<>();
		Set<KnowledgeDocument.Key> current = new HashSet<>();
		for (KnowledgeDocument document : documents) {
			current.add(document.key());
			if (!document.fingerprint(model).equals(indexed.get(document.key()))) {
				changed.add(document);
			}
		}
		List<KnowledgeDocument.Key> removed = indexed.keySet().stream().filter(key -> !current.contains(key)).toList();
		if (!removed.isEmpty()) {
			transaction.executeWithoutResult(status -> index.remove(ownerId, removed));
		}
		for (int from = 0; from < changed.size(); from += BATCH) {
			index(ownerId, changed.subList(from, Math.min(changed.size(), from + BATCH)), model);
		}
	}

	private void index(UUID ownerId, List<KnowledgeDocument> documents, String model) {
		List<String> texts = new ArrayList<>();
		List<List<String>> chunksPerDocument = new ArrayList<>();
		for (KnowledgeDocument document : documents) {
			List<String> chunks = TextChunker.split(document.text().isBlank() ? document.title() : document.text(),
					TextChunker.DEFAULT_MAX_LENGTH);
			chunksPerDocument.add(chunks);
			// The title gives each passage its context, both for the embedding and for the words.
			chunks.forEach(chunk -> texts.add(document.title() + "\n\n" + chunk));
		}
		List<float[]> vectors = null;
		String storedModel = model;
		if (!NO_MODEL.equals(model) && !texts.isEmpty()) {
			try {
				vectors = embeddings.embedDocuments(texts);
				if (vectors.size() != texts.size()) {
					throw new IllegalStateException("Expected %d vectors, got %d".formatted(texts.size(), vectors.size()));
				}
			}
			catch (RuntimeException ex) {
				log.warn("Embedding model failed, indexing {} documents by words only", documents.size(), ex);
				vectors = null;
				storedModel = NO_MODEL;
			}
		}
		int next = 0;
		for (int d = 0; d < documents.size(); d++) {
			KnowledgeDocument document = documents.get(d);
			List<IndexedChunk> rows = new ArrayList<>();
			List<String> chunks = chunksPerDocument.get(d);
			for (int position = 0; position < chunks.size(); position++) {
				float[] vector = vectors == null ? null : vectors.get(next);
				next++;
				rows.add(new IndexedChunk(document.key(), position, document.title(), chunks.get(position), vector));
			}
			// Indexed without vectors: a fingerprint for "none" makes the next search try again.
			String fingerprint = document.fingerprint(storedModel);
			String modelName = storedModel;
			transaction.executeWithoutResult(status -> index.replace(ownerId, document.key(), fingerprint, modelName, rows));
		}
	}

}
