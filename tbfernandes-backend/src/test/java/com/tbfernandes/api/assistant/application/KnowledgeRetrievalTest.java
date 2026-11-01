package com.tbfernandes.api.assistant.application;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.tbfernandes.api.assistant.application.port.out.EmbeddingModel;
import com.tbfernandes.api.assistant.application.port.out.KnowledgeIndex;
import com.tbfernandes.api.assistant.domain.IndexedChunk;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument.Key;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument.Kind;
import com.tbfernandes.api.assistant.domain.Passage;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;

/** AST-04: keeping the index in step with the notes, without Spring or a database. */
class KnowledgeRetrievalTest {

	private static final UUID OWNER = UUID.randomUUID();

	private final MemoryIndex index = new MemoryIndex();

	private final FakeEmbeddings embeddings = new FakeEmbeddings();

	private final KnowledgeRetrieval retrieval = new KnowledgeRetrieval(index, embeddings, new NoTransactions());

	private final KnowledgeDocument docker = document("Docker no WSL", "Instale o Docker Engine no Ubuntu.");

	private final KnowledgeDocument kafka = document("Kafka", "Tópicos e partições.");

	@Test
	void indexesNewDocumentsOnceAndFindsThem() {
		List<Passage> found = retrieval.search(OWNER, "docker", List.of(docker, kafka));
		retrieval.search(OWNER, "docker", List.of(docker, kafka));

		assertThat(found).extracting(Passage::source).containsExactly(docker.key());
		assertThat(embeddings.documentCalls).isEqualTo(1);
		assertThat(index.chunks(OWNER)).allSatisfy(chunk -> assertThat(chunk.vector()).isNotNull());
		assertThat(index.models.values()).containsOnly("fake:test");
	}

	@Test
	void reindexesAnEditedDocumentAndRemovesADeletedOne() {
		retrieval.search(OWNER, "docker", List.of(docker, kafka));
		KnowledgeDocument edited = new KnowledgeDocument(docker.key(), docker.title(), "Agora com Podman.");

		List<Passage> found = retrieval.search(OWNER, "podman", List.of(edited));

		assertThat(found).extracting(Passage::text).containsExactly("Agora com Podman.");
		assertThat(index.fingerprints(OWNER)).containsOnlyKeys(docker.key());
		assertThat(embeddings.documentCalls).isEqualTo(2);
	}

	@Test
	void aFailingProviderIndexesByWordsAndTriesAgainLater() {
		embeddings.failing = true;

		assertThat(retrieval.search(OWNER, "docker", List.of(docker))).hasSize(1);
		assertThat(index.models.values()).containsOnly("none");
		assertThat(index.chunks(OWNER).getFirst().vector()).isNull();

		embeddings.failing = false;
		retrieval.search(OWNER, "docker", List.of(docker));
		assertThat(index.models.values()).containsOnly("fake:test");
	}

	@Test
	void withoutAProviderEverythingIsFoundByWords() {
		embeddings.enabled = false;

		assertThat(retrieval.search(OWNER, "kafka", List.of(docker, kafka))).extracting(Passage::source)
			.containsExactly(kafka.key());
		assertThat(embeddings.documentCalls).isZero();
	}

	private static KnowledgeDocument document(String title, String text) {
		return new KnowledgeDocument(new Key(Kind.NOTE, UUID.randomUUID()), title, text);
	}

	static class FakeEmbeddings implements EmbeddingModel {

		boolean enabled = true;

		boolean failing;

		int documentCalls;

		@Override
		public String name() {
			return "fake:test";
		}

		@Override
		public boolean enabled() {
			return enabled;
		}

		@Override
		public List<float[]> embedDocuments(List<String> texts) {
			documentCalls++;
			if (failing) {
				throw new IllegalStateException("Provider down");
			}
			return texts.stream().map(t -> new float[] { 1, t.length() }).toList();
		}

		@Override
		public float[] embedQuery(String question) {
			if (failing) {
				throw new IllegalStateException("Provider down");
			}
			// Far from every passage, so only words decide in these tests.
			return new float[] { -1, 0 };
		}

	}

	static class MemoryIndex implements KnowledgeIndex {

		final Map<Key, String> fingerprints = new HashMap<>();

		final Map<Key, String> models = new HashMap<>();

		final Map<Key, List<IndexedChunk>> chunks = new HashMap<>();

		@Override
		public Map<Key, String> fingerprints(UUID ownerId) {
			return Map.copyOf(fingerprints);
		}

		@Override
		public void replace(UUID ownerId, Key document, String fingerprint, String embeddingModel,
				List<IndexedChunk> rows) {
			fingerprints.put(document, fingerprint);
			models.put(document, embeddingModel);
			chunks.put(document, rows);
		}

		@Override
		public void remove(UUID ownerId, Collection<Key> documents) {
			documents.forEach(key -> {
				fingerprints.remove(key);
				models.remove(key);
				chunks.remove(key);
			});
		}

		@Override
		public List<IndexedChunk> chunks(UUID ownerId) {
			List<IndexedChunk> all = new ArrayList<>();
			chunks.values().forEach(all::addAll);
			return all;
		}

	}

	static class NoTransactions implements PlatformTransactionManager {

		@Override
		public TransactionStatus getTransaction(TransactionDefinition definition) {
			return new SimpleTransactionStatus();
		}

		@Override
		public void commit(TransactionStatus status) {
		}

		@Override
		public void rollback(TransactionStatus status) {
		}

	}

}
