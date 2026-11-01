package com.tbfernandes.api.assistant.domain;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.assistant.domain.Answer.Reference;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument.Key;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument.Kind;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GroundedAnswerTest {

	private static final UUID NOTE = UUID.randomUUID();

	private static final UUID SNIPPET = UUID.randomUUID();

	private final List<Passage> passages = List.of(
			new Passage(new Key(Kind.NOTE, NOTE), "Docker no WSL", "Instale o Docker Engine.", 0.9),
			new Passage(new Key(Kind.SNIPPET, SNIPPET), "compose up", "Sobe tudo em segundo plano.", 0.8),
			new Passage(new Key(Kind.NOTE, NOTE), "Docker no WSL", "Depois ajuste o systemd.", 0.7));

	@Test
	void renumbersCitationsToTheCitedRecords() {
		Answer answer = GroundedAnswer.fromModel("Use o compose [2]. Instale o Engine [1] e o systemd [3, 1].", passages);

		assertThat(answer.source()).isEqualTo("rag");
		assertThat(answer.text()).isEqualTo("Use o compose [1]. Instale o Engine [2] e o systemd [2].");
		assertThat(answer.references()).extracting(Reference::label).containsExactly("compose up", "Docker no WSL");
		assertThat(answer.references().get(1).href()).isEqualTo("/knowledge?note=" + NOTE);
		assertThat(answer.references().get(1).excerpt()).isEqualTo("Instale o Docker Engine.");
	}

	@Test
	void dropsCitationsOfPassagesThatDoNotExist() {
		Answer answer = GroundedAnswer.fromModel("Instale o Engine [1] [9].", passages);

		assertThat(answer.text()).isEqualTo("Instale o Engine [1].");
		assertThat(answer.references()).hasSize(1);
	}

	@Test
	void listsEveryRecordWhenTheModelCitesNothing() {
		Answer answer = GroundedAnswer.fromModel("Não encontrei isso nas suas notas.", passages);

		assertThat(answer.references()).extracting(Reference::label).containsExactly("Docker no WSL", "compose up");
	}

	@Test
	void withoutAModelShowsTheExcerpts() {
		Answer answer = GroundedAnswer.excerpts(passages);

		assertThat(answer.source()).isEqualTo("search");
		assertThat(answer.text()).contains("Encontrei 2 trechos");
		assertThat(answer.references()).extracting(Reference::excerpt)
			.containsExactly("Instale o Docker Engine.", "Sobe tudo em segundo plano.");
	}

	@Test
	void excerptsArePlainText() {
		assertThat(GroundedAnswer.excerpt("## Contexto\nO **lag** do `consumer`:\n- um\n> citação"))
			.isEqualTo("Contexto O lag do consumer: um citação");
	}

	@Test
	void excerptsAreCutAtAWord() {
		String excerpt = GroundedAnswer.excerpt("palavra ".repeat(100));

		assertThat(excerpt).endsWith("palavra…").hasSizeLessThanOrEqualTo(GroundedAnswer.EXCERPT_LENGTH + 1);
	}

}
