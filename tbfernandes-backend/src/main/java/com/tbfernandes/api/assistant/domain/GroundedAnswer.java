package com.tbfernandes.api.assistant.domain;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.tbfernandes.api.assistant.domain.Answer.Reference;

/**
 * Answers built from retrieved passages (AST-04, RN-20): every reference is a record a passage
 * came from, so the links always point to real notes and snippets.
 */
public final class GroundedAnswer {

	static final int EXCERPT_LENGTH = 280;

	private static final Pattern CITATION = Pattern.compile("\\[(\\d+(?:\\s*,\\s*\\d+)*)\\]");

	private GroundedAnswer() {
	}

	/**
	 * The model's text, whose citations [n] name passages by their position from 1. Citations are
	 * renumbered to the order of the references, which are the cited records, each once; citations
	 * of passages that do not exist are removed. When the model cites nothing, every passage's
	 * record is listed, since they were all the answer could have come from.
	 */
	public static Answer fromModel(String text, List<Passage> passages) {
		Map<KnowledgeDocument.Key, Integer> order = new LinkedHashMap<>();
		Map<KnowledgeDocument.Key, Passage> firstPassage = new LinkedHashMap<>();
		Matcher matcher = CITATION.matcher(text);
		StringBuilder renumbered = new StringBuilder();
		while (matcher.find()) {
			List<Integer> numbers = new ArrayList<>();
			for (String part : matcher.group(1).split(",")) {
				int index = Integer.parseInt(part.strip()) - 1;
				if (index < 0 || index >= passages.size()) {
					continue;
				}
				Passage passage = passages.get(index);
				firstPassage.putIfAbsent(passage.source(), passage);
				int number = order.computeIfAbsent(passage.source(), key -> order.size() + 1);
				if (!numbers.contains(number)) {
					numbers.add(number);
				}
			}
			String replacement = numbers.isEmpty() ? ""
					: numbers.stream().map(n -> "[" + n + "]").collect(Collectors.joining());
			matcher.appendReplacement(renumbered, Matcher.quoteReplacement(replacement));
		}
		matcher.appendTail(renumbered);

		if (order.isEmpty()) {
			return new Answer(text.strip(), references(distinct(passages)), "rag");
		}
		String clean = renumbered.toString().replaceAll("[ \\t]+([.,;:!?])", "$1").strip();
		return new Answer(clean, references(List.copyOf(firstPassage.values())), "rag");
	}

	/**
	 * Without a model: the records whose passages were found, each with its excerpt, so the person
	 * reads what was found.
	 */
	public static Answer excerpts(List<Passage> passages) {
		List<Passage> sources = distinct(passages);
		String text = sources.size() == 1 ? "Encontrei um trecho nas suas notas e snippets que pode responder. Veja abaixo."
				: "Encontrei %d trechos nas suas notas e snippets que podem responder. Veja abaixo.".formatted(sources.size());
		return new Answer(text, references(sources), "search");
	}

	/** The start of a passage as plain text, without Markdown marks, cut at a word and on one line. */
	static String excerpt(String text) {
		String line = text.replaceAll("(?m)^\\s{0,3}(#{1,6}|>|[-*+])\\s+", "")
			.replaceAll("\\*\\*|__|`", "")
			.replaceAll("\\s+", " ")
			.strip();
		if (line.length() <= EXCERPT_LENGTH) {
			return line;
		}
		int space = line.lastIndexOf(' ', EXCERPT_LENGTH);
		return line.substring(0, space > EXCERPT_LENGTH / 2 ? space : EXCERPT_LENGTH) + "…";
	}

	private static List<Passage> distinct(List<Passage> passages) {
		Map<KnowledgeDocument.Key, Passage> first = new LinkedHashMap<>();
		passages.forEach(p -> first.putIfAbsent(p.source(), p));
		return List.copyOf(first.values());
	}

	private static List<Reference> references(List<Passage> passages) {
		return passages.stream()
			.map(p -> new Reference(p.source().kind().label(), p.title(), p.href(), excerpt(p.text())))
			.toList();
	}

}
