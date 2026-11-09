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
import { AssistantTracer } from './assistant-tracer';
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
    private readonly tracer: AssistantTracer,
  ) {}

  /** The passages that best answer the question, or an empty list. Never fails. */
  search(
    ownerId: string,
    question: string,
    documents: KnowledgeDocument[],
  ): Promise<Passage[]> {
    return this.tracer.step('retrieve-passages', 'retriever', async (step) => {
      step.update({ input: question });
      try {
        await this.synchronize(ownerId, documents);
        const questionVector = await this.questionVector(question);
        const chunks = await this.index.chunks(ownerId);
        const passages = PassageRanker.rank(
          question,
          questionVector,
          chunks,
          PASSAGES,
        );
        step.update({
          output: passages.map((passage, position) => ({
            position: position + 1,
            kind: passage.source.kind,
            title: passage.title,
            score: passage.score,
            text: passage.text,
          })),
          metadata: {
            documents: documents.length,
            indexedChunks: chunks.length,
            byMeaning: questionVector !== null,
          },
        });
        return passages;
      } catch (error) {
        this.logger.warn(`Knowledge retrieval failed: ${String(error)}`);
        step.update({ failure: String(error) });
        return [];
      }
    });
  }

  private async questionVector(question: string): Promise<number[] | null> {
    if (!this.embeddings.enabled()) return null;
    try {
      return await this.embeddings.embedQuery(question);
    } catch (error) {
      this.logger.warn(
        `Embedding model failed for the question, searching by words: ${String(error)}`,
      );
      return null;
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
    const current = new Set(documents.map((document) => keyOf(document.key)));
    const changed = documents.filter(
      (document) =>
        KnowledgeDocuments.fingerprint(document, model) !==
        indexed.get(keyOf(document.key))?.fingerprint,
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

  /** Falls back to indexing by words only when the embedding model fails. */
  private async embed(
    texts: string[],
    model: string,
    documentCount: number,
  ): Promise<{ vectors: number[][] | null; storedModel: string }> {
    if (model === NO_MODEL || texts.length === 0)
      return { vectors: null, storedModel: model };
    try {
      const vectors = await this.embeddings.embedDocuments(texts);
      if (vectors.length !== texts.length) {
        throw new Error(
          `Expected ${texts.length} vectors, got ${vectors.length}`,
        );
      }
      return { vectors, storedModel: model };
    } catch (error) {
      this.logger.warn(
        `Embedding model failed, indexing ${documentCount} documents by words only: ${String(error)}`,
      );
      return { vectors: null, storedModel: NO_MODEL };
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
    const { vectors, storedModel } = await this.embed(
      texts,
      model,
      documents.length,
    );
    let next = 0;
    for (const [documentIndex, document] of documents.entries()) {
      const rows: IndexedChunk[] = chunksPerDocument[documentIndex].map(
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
