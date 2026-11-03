import { DocumentKey, IndexedChunk } from '../domain';

/**
 * The retrieval index (AST-04): the passages of each owner's notes and snippets, with their
 * embeddings. It is derived data, rebuilt from the knowledge module at any time.
 */
export abstract class KnowledgeIndex {
  /** The fingerprint each indexed document had when it was indexed, by keyOf(document). */
  abstract fingerprints(
    ownerId: string,
  ): Promise<Map<string, { key: DocumentKey; fingerprint: string }>>;
  /** Replaces every passage of the document. */
  abstract replace(
    ownerId: string,
    document: DocumentKey,
    fingerprint: string,
    embeddingModel: string,
    chunks: IndexedChunk[],
  ): Promise<void>;
  abstract remove(ownerId: string, documents: DocumentKey[]): Promise<void>;
  abstract chunks(ownerId: string): Promise<IndexedChunk[]>;
}
