import { Injectable, Logger } from '@nestjs/common';
import { UnitOfWork } from '../../../common/application';
import {
  IndexedChunk,
  KnowledgeDocument,
  KnowledgeDocuments,
  keyOf,
  Passage,
  PassageRanker,
  TextChunker,
} from '../domain';
import { EmbeddingModel } from './embedding.model';
import { KnowledgeIndex } from './knowledge.index';

export const PASSAGES = 6;
/** Providers accept many texts per request; smaller batches keep each request short. */
export const BATCH = 64;
const NO_MODEL = 'none';

/**
 * Retrieval for the assistant (AST-04). Before each search the index is brought up to date
 * with the notes and snippets passed in: documents whose fingerprint changed are split and
 * embedded again, deleted ones are removed. The embedding calls run outside any transaction.
 * When the provider fails, passages are stored without vectors and found by their words; the
 * next search tries to embed them again.
 */
@Injectable()
export class KnowledgeRetrievalService {
  private readonly logger = new Logger('KnowledgeRetrieval');
  /** One synchronization per owner at a time, so two questions do not index the same document twice. */
  private readonly running = new Map<string, Promise<void>>();

  constructor(
    private readonly index: KnowledgeIndex,
    private readonly embeddings: EmbeddingModel,
    private readonly uow: UnitOfWork,
  ) {}

  /** The passages that best answer the question, or an empty list. Never fails. */
  async search(
    ownerId: string,
    question: string,
    documents: KnowledgeDocument[],
  ): Promise<Passage[]> {
    try {
      await this.synchronize(ownerId, documents);
      let questionVector: number[] | null = null;
      if (this.embeddings.enabled()) {
        try {
          questionVector = await this.embeddings.embedQuery(question);
        } catch (error) {
          this.logger.warn(
            `Embedding model failed for the question, searching by words: ${String(error)}`,
          );
        }
      }
      return PassageRanker.rank(
        question,
        questionVector,
        await this.index.chunks(ownerId),
        PASSAGES,
      );
    } catch (error) {
      this.logger.warn(`Knowledge retrieval failed: ${String(error)}`);
      return [];
    }
  }

  synchronize(ownerId: string, documents: KnowledgeDocument[]): Promise<void> {
    const previous = this.running.get(ownerId) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => this.doSynchronize(ownerId, documents));
    this.running.set(ownerId, next);
    void next
      .finally(() => {
        if (this.running.get(ownerId) === next) this.running.delete(ownerId);
      })
      .catch(() => undefined);
    return next;
  }

  private async doSynchronize(
    ownerId: string,
    documents: KnowledgeDocument[],
  ): Promise<void> {
    const indexed = await this.index.fingerprints(ownerId);
    const model = this.embeddings.enabled() ? this.embeddings.name() : NO_MODEL;
    const current = new Set(documents.map((d) => keyOf(d.key)));
    const changed = documents.filter(
      (d) =>
        KnowledgeDocuments.fingerprint(d, model) !==
        indexed.get(keyOf(d.key))?.fingerprint,
    );
    const removed = [...indexed.entries()]
      .filter(([key]) => !current.has(key))
      .map(([, entry]) => entry.key);
    if (removed.length) {
      await this.uow.run(() => this.index.remove(ownerId, removed));
    }
    for (let from = 0; from < changed.length; from += BATCH) {
      await this.indexDocuments(
        ownerId,
        changed.slice(from, from + BATCH),
        model,
      );
    }
  }

  private async indexDocuments(
    ownerId: string,
    documents: KnowledgeDocument[],
    model: string,
  ): Promise<void> {
    const texts: string[] = [];
    const chunksPerDocument = documents.map((document) => {
      const chunks = TextChunker.split(
        document.text.trim() === '' ? document.title : document.text,
      );
      // The title gives each passage its context, both for the embedding and for the words.
      chunks.forEach((chunk) => texts.push(`${document.title}\n\n${chunk}`));
      return chunks;
    });
    let vectors: number[][] | null = null;
    let storedModel = model;
    if (model !== NO_MODEL && texts.length) {
      try {
        vectors = await this.embeddings.embedDocuments(texts);
        if (vectors.length !== texts.length) {
          throw new Error(
            `Expected ${texts.length} vectors, got ${vectors.length}`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Embedding model failed, indexing ${documents.length} documents by words only: ${String(error)}`,
        );
        vectors = null;
        storedModel = NO_MODEL;
      }
    }
    let next = 0;
    for (const [d, document] of documents.entries()) {
      const rows: IndexedChunk[] = chunksPerDocument[d].map(
        (text, position) => ({
          source: document.key,
          position,
          title: document.title,
          text,
          vector: vectors ? vectors[next++] : null,
        }),
      );
      // Indexed without vectors: a fingerprint for "none" makes the next search try again.
      const fingerprint = KnowledgeDocuments.fingerprint(document, storedModel);
      await this.uow.run(() =>
        this.index.replace(
          ownerId,
          document.key,
          fingerprint,
          storedModel,
          rows,
        ),
      );
    }
  }
}
