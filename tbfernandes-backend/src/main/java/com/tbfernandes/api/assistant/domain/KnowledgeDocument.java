package com.tbfernandes.api.assistant.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.KnowledgeLookup.NoteView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.SnippetView;

/**
 * A note or snippet as the retrieval index sees it (AST-04): its title and the text that is
 * split into passages. The links match the ones the rule-based assistant builds.
 */
public record KnowledgeDocument(Key key, String title, String text) {

	public enum Kind {

		NOTE("Nota"), SNIPPET("Snippet");

		private final String label;

		Kind(String label) {
			this.label = label;
		}

		public String label() {
			return label;
		}

		public String href(UUID id) {
			return this == NOTE ? "/knowledge?note=" + id : "/knowledge/snippets";
		}

	}

	/** Identifies the record a passage came from. */
	public record Key(Kind kind, UUID id) {
	}

	public static List<KnowledgeDocument> of(List<NoteView> notes, List<SnippetView> snippets) {
		List<KnowledgeDocument> documents = new ArrayList<>();
		notes.forEach(n -> documents.add(new KnowledgeDocument(new Key(Kind.NOTE, n.id()), n.title(),
				withTags(n.body(), n.tags()))));
		snippets.forEach(s -> documents.add(new KnowledgeDocument(new Key(Kind.SNIPPET, s.id()), s.title(),
				withTags(s.explanation(), s.tags()))));
		return documents;
	}

	public static List<KnowledgeDocument> of(Workspace workspace) {
		return of(workspace.notes(), workspace.snippets());
	}

	/**
	 * Changes when the title, the text or the embedding model changes, so the index knows which
	 * documents to split and embed again.
	 */
	public String fingerprint(String embeddingModel) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			for (String part : List.of(title, text, embeddingModel)) {
				digest.update(part.getBytes(StandardCharsets.UTF_8));
				digest.update((byte) 0);
			}
			return HexFormat.of().formatHex(digest.digest());
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is part of every JDK", ex);
		}
	}

	private static String withTags(String body, List<String> tags) {
		String text = body == null ? "" : body.strip();
		return tags.isEmpty() ? text : text + "\n\nTags: " + String.join(", ", tags);
	}

}
