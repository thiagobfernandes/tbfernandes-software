package com.tbfernandes.api.assistant.domain;

import java.util.ArrayList;
import java.util.List;

/**
 * Splits a document's text into passages of at most {@code maxLength} characters (AST-04).
 * Paragraphs stay whole when they fit; a longer paragraph is cut at the end of a sentence, or at
 * a space when a sentence is too long. Short paragraphs are joined, so a passage has context.
 */
public final class TextChunker {

	public static final int DEFAULT_MAX_LENGTH = 1200;

	private TextChunker() {
	}

	public static List<String> split(String text, int maxLength) {
		if (maxLength < 50) {
			throw new IllegalArgumentException("maxLength must be at least 50");
		}
		List<String> pieces = new ArrayList<>();
		for (String paragraph : text.strip().split("\\n\\s*\\n")) {
			String trimmed = paragraph.strip();
			if (!trimmed.isEmpty()) {
				pieces.addAll(cut(trimmed, maxLength));
			}
		}
		List<String> chunks = new ArrayList<>();
		StringBuilder current = new StringBuilder();
		for (String piece : pieces) {
			if (current.length() > 0 && current.length() + 2 + piece.length() > maxLength) {
				chunks.add(current.toString());
				current.setLength(0);
			}
			if (current.length() > 0) {
				current.append("\n\n");
			}
			current.append(piece);
		}
		if (current.length() > 0) {
			chunks.add(current.toString());
		}
		return chunks;
	}

	private static List<String> cut(String paragraph, int maxLength) {
		List<String> parts = new ArrayList<>();
		String rest = paragraph;
		while (rest.length() > maxLength) {
			int end = lastBreak(rest, maxLength);
			parts.add(rest.substring(0, end).strip());
			rest = rest.substring(end).strip();
		}
		if (!rest.isEmpty()) {
			parts.add(rest);
		}
		return parts;
	}

	/** Where to cut: after the last sentence end, else at the last space, else at the limit. */
	private static int lastBreak(String text, int maxLength) {
		for (int i = maxLength - 1; i > maxLength / 2; i--) {
			char c = text.charAt(i);
			if ((c == '.' || c == '!' || c == '?' || c == '\n') && Character.isWhitespace(text.charAt(i + 1))) {
				return i + 1;
			}
		}
		int space = text.lastIndexOf(' ', maxLength);
		return space > maxLength / 2 ? space : maxLength;
	}

}
