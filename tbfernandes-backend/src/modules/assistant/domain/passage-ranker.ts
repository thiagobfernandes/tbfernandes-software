import { IndexedChunk, keyOf, Passage } from './knowledge-document';

/** Below this cosine a passage only counts if it shares words with the question. */
export const MIN_COSINE = 0.35;
export const VECTOR_WEIGHT = 0.7;
export const MAX_PER_DOCUMENT = 2;
const K1 = 1.2;
const B = 0.75;

/** Common Portuguese and English words that say nothing about what is asked. */
const STOP_WORDS = new Set(
  (
    'que qual quais como onde quando por para com sem uma uns umas dos das nos nas pelo pela ' +
    'sobre tem ter meu minha meus minhas isso esse essa este esta foi sao ser mais menos algo ' +
    'tudo voce eu the and for with what how about does did have has from that this are was ' +
    'anything something nao sim ja eh seu sua nem mas ou aos num numa fiz faco'
  ).split(' '),
);

/**
 * Hybrid retrieval over the indexed passages (AST-04): BM25 over the words, plus cosine
 * similarity of the embeddings when the question and the passage both have one. Runs in the
 * application, so it works the same on the desktop's PostgreSQL, which has no pgvector.
 */
export const PassageRanker = {
  /**
   * The best passages for the question, most relevant first, at most `limit` and at most
   * MAX_PER_DOCUMENT from the same document. questionVector may be null.
   */
  rank(
    question: string,
    questionVector: number[] | null,
    chunks: IndexedChunk[],
    limit: number,
  ): Passage[] {
    if (chunks.length === 0 || limit <= 0) return [];
    const terms = new Set(PassageRanker.tokens(question));
    const lexical = bm25(terms, chunks);
    const maxLexical = Math.max(0, ...lexical);
    const scored: Passage[] = [];
    chunks.forEach((chunk, i) => {
      const words = maxLexical > 0 ? lexical[i] / maxLexical : 0;
      let score: number;
      if (
        questionVector != null &&
        chunk.vector != null &&
        chunk.vector.length === questionVector.length
      ) {
        const cosine = PassageRanker.cosine(questionVector, chunk.vector);
        if (cosine < MIN_COSINE && words === 0) return;
        score =
          VECTOR_WEIGHT * Math.max(0, cosine) + (1 - VECTOR_WEIGHT) * words;
      } else {
        if (words === 0) return;
        score = words;
      }
      scored.push({
        source: chunk.source,
        title: chunk.title,
        text: chunk.text,
        score: Math.min(1, score),
      });
    });
    scored.sort((a, b) => b.score - a.score);
    const perDocument = new Map<string, number>();
    const result: Passage[] = [];
    for (const passage of scored) {
      if (result.length === limit) break;
      const key = keyOf(passage.source);
      const count = (perDocument.get(key) ?? 0) + 1;
      perDocument.set(key, count);
      if (count <= MAX_PER_DOCUMENT) result.push(passage);
    }
    return result;
  },

  /** Lower case, without accents, words of three letters or more that are not stop words. */
  tokens(text: string): string[] {
    return text
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  },

  cosine(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
  },
};

/** Okapi BM25 of each chunk (title and text) for the question's terms. */
function bm25(terms: Set<string>, chunks: IndexedChunk[]): number[] {
  const scores = new Array<number>(chunks.length).fill(0);
  if (terms.size === 0) return scores;
  const frequencies: Map<string, number>[] = [];
  const lengths: number[] = [];
  const documentFrequency = new Map<string, number>();
  let totalLength = 0;
  for (const chunk of chunks) {
    const words = PassageRanker.tokens(`${chunk.title} ${chunk.text}`);
    totalLength += words.length;
    const tf = new Map<string, number>();
    for (const word of words)
      if (terms.has(word)) tf.set(word, (tf.get(word) ?? 0) + 1);
    for (const term of tf.keys())
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    frequencies.push(tf);
    lengths.push(words.length);
  }
  const averageLength = Math.max(1, totalLength / chunks.length);
  const n = chunks.length;
  for (let i = 0; i < n; i++) {
    let score = 0;
    for (const term of terms) {
      const f = frequencies[i].get(term);
      if (f == null) continue;
      const df = documentFrequency.get(term)!;
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
      score +=
        (idf * (f * (K1 + 1))) /
        (f + K1 * (1 - B + (B * lengths[i]) / averageLength));
    }
    scores[i] = score;
  }
  return scores;
}
