import { IndexedChunk, keyOf, Passage } from './knowledge-document';

/** Below this cosine a passage only counts if it shares words with the question. */
export const MIN_COSINE = 0.35;
export const VECTOR_WEIGHT = 0.7;
export const MAX_PER_DOCUMENT = 2;
const K1 = 1.2;
const LENGTH_NORMALIZATION = 0.75;

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
    chunks.forEach((chunk, index) => {
      const words = maxLexical > 0 ? lexical[index] / maxLexical : 0;
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
    scored.sort((left, right) => right.score - left.score);
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
      .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  },

  cosine(left: number[], right: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let index = 0; index < left.length; index++) {
      dot += left[index] * right[index];
      normA += left[index] * left[index];
      normB += right[index] * right[index];
    }
    return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
  },
};

interface TermStatistics {
  termCountsPerChunk: Map<string, number>[];
  lengths: number[];
  documentFrequency: Map<string, number>;
  averageLength: number;
}

function countTerms(words: string[], terms: Set<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const word of words)
    if (terms.has(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
  return counts;
}

function termStatistics(
  terms: Set<string>,
  chunks: IndexedChunk[],
): TermStatistics {
  const termCountsPerChunk: Map<string, number>[] = [];
  const lengths: number[] = [];
  const documentFrequency = new Map<string, number>();
  for (const chunk of chunks) {
    const words = PassageRanker.tokens(`${chunk.title} ${chunk.text}`);
    const counts = countTerms(words, terms);
    for (const term of counts.keys())
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    termCountsPerChunk.push(counts);
    lengths.push(words.length);
  }
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  return {
    termCountsPerChunk,
    lengths,
    documentFrequency,
    averageLength: Math.max(1, totalLength / chunks.length),
  };
}

function termScore(
  termFrequency: number,
  documentFrequency: number,
  chunkCount: number,
  lengthRatio: number,
): number {
  const inverseDocumentFrequency = Math.log(
    1 + (chunkCount - documentFrequency + 0.5) / (documentFrequency + 0.5),
  );
  const lengthPenalty =
    1 - LENGTH_NORMALIZATION + LENGTH_NORMALIZATION * lengthRatio;
  return (
    (inverseDocumentFrequency * (termFrequency * (K1 + 1))) /
    (termFrequency + K1 * lengthPenalty)
  );
}

function bm25(terms: Set<string>, chunks: IndexedChunk[]): number[] {
  if (terms.size === 0) return new Array<number>(chunks.length).fill(0);
  const statistics = termStatistics(terms, chunks);
  return chunks.map((_, chunkIndex) => {
    const termCounts = statistics.termCountsPerChunk[chunkIndex];
    const lengthRatio =
      statistics.lengths[chunkIndex] / statistics.averageLength;
    let score = 0;
    for (const term of terms) {
      const termFrequency = termCounts.get(term);
      if (termFrequency == null) continue;
      score += termScore(
        termFrequency,
        statistics.documentFrequency.get(term)!,
        chunks.length,
        lengthRatio,
      );
    }
    return score;
  });
}
