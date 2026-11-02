package com.tbfernandes.api.assistant.domain;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.knowledge.KnowledgeLookup.NoteView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.SnippetView;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class KnowledgeDocumentTest {

	@Test
	void notesAndSnippetsBecomeDocumentsWithTheirTags() {
		UUID noteId = UUID.randomUUID();
		List<KnowledgeDocument> documents = KnowledgeDocument.of(
				List.of(new NoteView(noteId, "Docker", "Engine no WSL", List.of("devops"), Set.of(), Set.of())),
				List.of(new SnippetView(UUID.randomUUID(), "compose", null, List.of(), Set.of(), Set.of())));

		assertThat(documents).extracting(KnowledgeDocument::text).containsExactly("Engine no WSL\n\nTags: devops", "");
		assertThat(documents.getFirst().key().kind().href(noteId)).isEqualTo("/knowledge?note=" + noteId);
	}

	@Test
	void theFingerprintChangesWithTheTextAndTheModel() {
		KnowledgeDocument document = new KnowledgeDocument(
				new KnowledgeDocument.Key(KnowledgeDocument.Kind.NOTE, UUID.randomUUID()), "Título", "Texto");
		KnowledgeDocument edited = new KnowledgeDocument(document.key(), "Título", "Texto novo");

		assertThat(document.fingerprint("none")).isEqualTo(document.fingerprint("none")).hasSize(64);
		assertThat(document.fingerprint("none")).isNotEqualTo(edited.fingerprint("none"))
			.isNotEqualTo(document.fingerprint("voyage:voyage-3.5-lite"));
	}

}
