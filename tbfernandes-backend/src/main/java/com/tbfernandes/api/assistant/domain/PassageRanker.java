package com.tbfernandes.api.assistant.domain;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Hybrid retrieval over the indexed passages (AST-04): BM25 over the words, plus cosine
 * similarity of the embeddings when the question and the passage both have one. Pure Java, so
 * it runs the same on the embedded PostgreSQL of the desktop app, which has no pgvector.
 */
public final class PassageRanker {

	/** Below this cosine a passage only counts if it shares words with the question. */
	static final double MIN_COSINE = 0.35;

	static final double VECTOR_WEIGHT = 0.7;

	static final int MAX_PER_DOCUMENT = 2;

	private static final double K1 = 1.2;

	private static final double B = 0.75;

	/** Common Portuguese and English words that say nothing about what is asked. */
	private static final Set<String> STOP_WORDS = Set.of("que", "qual", "quais", "como", "onde", "quando", "por",
			"para", "com", "sem", "uma", "uns", "umas", "dos", "das", "nos", "nas", "pelo", "pela", "sobre", "tem",
			"ter", "meu", "minha", "meus", "minhas", "isso", "esse", "essa", "este", "esta", "foi", "sao", "ser",
			"mais", "menos", "algo", "tudo", "voce", "eu", "the", "and", "for", "with", "what", "how", "about",
			"does", "did", "have", "has", "from", "that", "this", "are", "was", "anything", "something", "nao", "sim",
			"ja", "eh", "seu", "sua", "nem", "mas", "ou", "aos", "num", "numa", "fiz", "faco");

	private PassageRanker() {
	}

	/**
	 * The best passages for the question, most relevant first, at most {@code limit} and at most
	 * {@link #MAX_PER_DOCUMENT} from the same document. {@code questionVector} may be null.
	 */
	public static List<Passage> rank(String question, float[] questionVector, List<IndexedChunk> chunks, int limit) {
		if (chunks.isEmpty() || limit <= 0) {
			return List.of();
		}
		Set<String> terms = new HashSet<>(tokens(question));
		double[] lexical = bm25(terms, chunks);
		double maxLexical = Arrays.stream(lexical).max().orElse(0);

		List<Passage> scored = new ArrayList<>();
		for (int i = 0; i < chunks.size(); i++) {
			IndexedChunk chunk = chunks.get(i);
			double words = maxLexical > 0 ? lexical[i] / maxLexical : 0;
			double score;
			if (questionVector != null && chunk.vector() != null && chunk.vector().length == questionVector.length) {
				double cosine = cosine(questionVector, chunk.vector());
				if (cosine < MIN_COSINE && words == 0) {
					continue;
				}
				score = VECTOR_WEIGHT * Math.max(0, cosine) + (1 - VECTOR_WEIGHT) * words;
			}
			else {
				if (words == 0) {
					continue;
				}
				score = words;
			}
			scored.add(new Passage(chunk.source(), chunk.title(), chunk.text(), Math.min(1, score)));
		}
		scored.sort(Comparator.comparingDouble(Passage::score).reversed());

		Map<KnowledgeDocument.Key, Integer> perDocument = new HashMap<>();
		List<Passage> result = new ArrayList<>();
		for (Passage passage : scored) {
			if (result.size() == limit) {
				break;
			}
			if (perDocument.merge(passage.source(), 1, Integer::sum) <= MAX_PER_DOCUMENT) {
				result.add(passage);
			}
		}
		return result;
	}

	/** Lower case, without accents, words of three letters or more that are not stop words. */
	static List<String> tokens(String text) {
		String plain = Normalizer.normalize(text, Normalizer.Form.NFD)
			.replaceAll("\\p{M}+", "")
			.toLowerCase(Locale.ROOT);
		return Arrays.stream(plain.split("[^\\p{L}\\p{N}]+"))
			.filter(w -> w.length() >= 3 && !STOP_WORDS.contains(w))
			.toList();
	}

	static double cosine(float[] a, float[] b) {
		double dot = 0;
		double normA = 0;
		double normB = 0;
		for (int i = 0; i < a.length; i++) {
			dot += a[i] * b[i];
			normA += a[i] * a[i];
			normB += b[i] * b[i];
		}
		return normA == 0 || normB == 0 ? 0 : dot / Math.sqrt(normA * normB);
	}

	/** Okapi BM25 of each chunk (title and text) for the question's terms. */
	private static double[] bm25(Set<String> terms, List<IndexedChunk> chunks) {
		double[] scores = new double[chunks.size()];
		if (terms.isEmpty()) {
			return scores;
		}
		List<Map<String, Integer>> frequencies = new ArrayList<>();
		Map<String, Integer> documentFrequency = new HashMap<>();
		long totalLength = 0;
		for (IndexedChunk chunk : chunks) {
			List<String> words = tokens(chunk.title() + " " + chunk.text());
			totalLength += words.size();
			Map<String, Integer> tf = new HashMap<>();
			for (String word : words) {
				if (terms.contains(word)) {
					tf.merge(word, 1, Integer::sum);
				}
			}
			tf.keySet().forEach(term -> documentFrequency.merge(term, 1, Integer::sum));
			tf.put("", words.size());
			frequencies.add(tf);
		}
		double averageLength = Math.max(1, (double) totalLength / chunks.size());
		int n = chunks.size();
		for (int i = 0; i < n; i++) {
			Map<String, Integer> tf = frequencies.get(i);
			int length = tf.get("");
			double score = 0;
			for (String term : terms) {
				Integer f = tf.get(term);
				if (f == null) {
					continue;
				}
				int df = documentFrequency.get(term);
				double idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
				score += idf * (f * (K1 + 1)) / (f + K1 * (1 - B + B * length / averageLength));
			}
			scores[i] = score;
		}
		return scores;
	}

}
