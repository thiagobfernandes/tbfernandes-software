/**
 * The embedding provider (AST-04). Turns passages and questions into vectors, so retrieval
 * finds passages that mean the same with other words. Only the text of notes, snippets and the
 * question leaves the application.
 */
export abstract class EmbeddingModel {
  /** Stored with every vector, so changing the model embeds the documents again. "none" when off. */
  abstract name(): string;
  abstract enabled(): boolean;
  /** One vector per text, in the same order. */
  abstract embedDocuments(texts: string[]): Promise<number[][]>;
  abstract embedQuery(question: string): Promise<number[]>;
}
