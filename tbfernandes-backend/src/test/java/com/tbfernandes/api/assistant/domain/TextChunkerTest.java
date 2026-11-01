package com.tbfernandes.api.assistant.domain;

import java.util.List;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TextChunkerTest {

	@Test
	void joinsShortParagraphsIntoOnePassage() {
		assertThat(TextChunker.split("Primeiro.\n\nSegundo.\n\n\nTerceiro.", 100))
			.containsExactly("Primeiro.\n\nSegundo.\n\nTerceiro.");
	}

	@Test
	void startsANewPassageWhenTheNextParagraphDoesNotFit() {
		String a = "a".repeat(60);
		String b = "b".repeat(60);
		assertThat(TextChunker.split(a + "\n\n" + b, 100)).containsExactly(a, b);
	}

	@Test
	void cutsALongParagraphAtTheEndOfASentence() {
		String sentence = "Esta frase tem umas quarenta letras ok. ";
		List<String> chunks = TextChunker.split(sentence.repeat(5), 100);
		assertThat(chunks).allSatisfy(chunk -> {
			assertThat(chunk.length()).isLessThanOrEqualTo(100);
			assertThat(chunk).endsWith(".");
		});
		assertThat(String.join(" ", chunks)).isEqualTo(sentence.repeat(5).strip());
	}

	@Test
	void cutsAtTheLimitWhenThereIsNoSpace() {
		assertThat(TextChunker.split("x".repeat(250), 100)).extracting(String::length).containsExactly(100, 100, 50);
	}

	@Test
	void emptyTextHasNoPassages() {
		assertThat(TextChunker.split("  \n\n ", 100)).isEmpty();
	}

	@Test
	void rejectsTinyLimits() {
		assertThatThrownBy(() -> TextChunker.split("text", 10)).isInstanceOf(IllegalArgumentException.class);
	}

}
