package com.tbfernandes.api.assistant.domain;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.assistant.domain.KnowledgeDocument.Key;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument.Kind;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PassageRankerTest {

	private static final Key DOCKER = new Key(Kind.NOTE, UUID.randomUUID());

	private static final Key KAFKA = new Key(Kind.NOTE, UUID.randomUUID());

	private static final Key RECIPE = new Key(Kind.SNIPPET, UUID.randomUUID());

	@Test
	void findsPassagesByTheirWordsIgnoringAccentsAndCase() {
		List<IndexedChunk> chunks = List.of(chunk(DOCKER, 0, "Docker no WSL", "Instalação do Docker Engine no Ubuntu.", null),
				chunk(KAFKA, 0, "Kafka", "Tópicos, partições e consumidores.", null));

		List<Passage> found = PassageRanker.rank("Como fiz a instalacao do docker?", null, chunks, 5);

		assertThat(found).extracting(Passage::source).containsExactly(DOCKER);
		assertThat(found.getFirst().score()).isEqualTo(1.0);
	}

	@Test
	void stopWordsAloneFindNothing() {
		List<IndexedChunk> chunks = List.of(chunk(DOCKER, 0, "Docker", "Como instalar o que for preciso.", null));

		assertThat(PassageRanker.rank("como o que", null, chunks, 5)).isEmpty();
	}

	@Test
	void embeddingsFindPassagesWrittenWithOtherWords() {
		List<IndexedChunk> chunks = List.of(chunk(DOCKER, 0, "Containers", "Engine no Ubuntu", new float[] { 1, 0, 0 }),
				chunk(RECIPE, 0, "Bolo", "Farinha e ovos", new float[] { 0, 1, 0 }));

		List<Passage> found = PassageRanker.rank("como subir o docker", new float[] { 0.9f, 0.1f, 0 }, chunks, 5);

		assertThat(found).extracting(Passage::source).containsExactly(DOCKER);
	}

	@Test
	void sharedWordsKeepAPassageWhoseVectorIsFar() {
		List<IndexedChunk> chunks = List.of(chunk(KAFKA, 0, "Kafka", "Partições", new float[] { 0, 1 }));

		assertThat(PassageRanker.rank("kafka", new float[] { 1, 0 }, chunks, 5)).hasSize(1);
	}

	@Test
	void passagesWithoutAVectorStillCountByWords() {
		List<IndexedChunk> chunks = List.of(chunk(DOCKER, 0, "Docker", "Engine", null),
				chunk(KAFKA, 0, "Kafka", "Docker compose do Kafka", new float[] { 1, 0 }));

		assertThat(PassageRanker.rank("docker", new float[] { 1, 0 }, chunks, 5)).extracting(Passage::source)
			.containsExactlyInAnyOrder(DOCKER, KAFKA);
	}

	@Test
	void keepsAtMostTwoPassagesPerDocumentAndTheLimit() {
		List<IndexedChunk> chunks = List.of(chunk(DOCKER, 0, "Docker", "docker um", null),
				chunk(DOCKER, 1, "Docker", "docker dois", null), chunk(DOCKER, 2, "Docker", "docker três", null),
				chunk(KAFKA, 0, "Kafka", "docker no kafka", null));

		assertThat(PassageRanker.rank("docker", null, chunks, 10)).extracting(Passage::source)
			.containsOnly(DOCKER, KAFKA)
			.filteredOn(DOCKER::equals)
			.hasSize(2);
		assertThat(PassageRanker.rank("docker", null, chunks, 1)).hasSize(1);
	}

	@Test
	void cosineOfOppositeAndEqualVectors() {
		assertThat(PassageRanker.cosine(new float[] { 1, 2 }, new float[] { 2, 4 })).isCloseTo(1.0, org.assertj.core.data.Offset.offset(1e-9));
		assertThat(PassageRanker.cosine(new float[] { 1, 0 }, new float[] { -1, 0 })).isEqualTo(-1.0);
		assertThat(PassageRanker.cosine(new float[] { 0, 0 }, new float[] { 1, 0 })).isZero();
	}

	private static IndexedChunk chunk(Key key, int position, String title, String text, float[] vector) {
		return new IndexedChunk(key, position, title, text, vector);
	}

}
