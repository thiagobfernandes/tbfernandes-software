import { Injectable } from '@nestjs/common';
import { TransactionalManager } from '../../../../infrastructure/database/transactions';
import { KnowledgeIndex } from '../../application/knowledge.index';
import { DocumentKey, DocumentKind, IndexedChunk, keyOf } from '../../domain';

interface ChunkRow {
  source_kind: DocumentKind;
  source_id: string;
  position: number;
  title: string;
  content: string;
  embedding: number[] | null;
}

/**
 * The retrieval index in assistant.knowledge_chunk (AST-04). Plain SQL, because the rows are
 * derived data replaced as a whole and the embedding is a real[] array (the PostgreSQL of the
 * desktop app has no pgvector).
 */
@Injectable()
export class SqlKnowledgeIndex extends KnowledgeIndex {
  constructor(private readonly tx: TransactionalManager) {
    super();
  }

  async fingerprints(
    ownerId: string,
  ): Promise<Map<string, { key: DocumentKey; fingerprint: string }>> {
    const rows: Array<
      Pick<ChunkRow, 'source_kind' | 'source_id'> & { fingerprint: string }
    > = await this.tx.manager.query(
      `SELECT DISTINCT source_kind, source_id, fingerprint
         FROM assistant.knowledge_chunk WHERE owner_id = $1`,
      [ownerId],
    );
    const result = new Map<string, { key: DocumentKey; fingerprint: string }>();
    for (const row of rows) {
      const key = { kind: row.source_kind, id: row.source_id };
      result.set(keyOf(key), { key, fingerprint: row.fingerprint });
    }
    return result;
  }

  async replace(
    ownerId: string,
    document: DocumentKey,
    fingerprint: string,
    embeddingModel: string,
    chunks: IndexedChunk[],
  ): Promise<void> {
    await this.delete(ownerId, document);
    for (const chunk of chunks) {
      await this.tx.manager.query(
        `INSERT INTO assistant.knowledge_chunk
           (owner_id, source_kind, source_id, position, title, content, fingerprint, embedding_model, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::real[])`,
        [
          ownerId,
          document.kind,
          document.id,
          chunk.position,
          chunk.title,
          chunk.text,
          fingerprint,
          embeddingModel,
          chunk.vector,
        ],
      );
    }
  }

  async remove(ownerId: string, documents: DocumentKey[]): Promise<void> {
    for (const document of documents) await this.delete(ownerId, document);
  }

  async chunks(ownerId: string): Promise<IndexedChunk[]> {
    const rows: ChunkRow[] = await this.tx.manager.query(
      `SELECT source_kind, source_id, position, title, content, embedding
       FROM assistant.knowledge_chunk WHERE owner_id = $1
       ORDER BY source_kind, source_id, position`,
      [ownerId],
    );
    return rows.map((row) => ({
      source: { kind: row.source_kind, id: row.source_id },
      position: row.position,
      title: row.title,
      text: row.content,
      vector: row.embedding ? row.embedding.map(Number) : null,
    }));
  }

  private async delete(ownerId: string, document: DocumentKey): Promise<void> {
    await this.tx.manager.query(
      `DELETE FROM assistant.knowledge_chunk
       WHERE owner_id = $1 AND source_kind = $2 AND source_id = $3`,
      [ownerId, document.kind, document.id],
    );
  }
}
