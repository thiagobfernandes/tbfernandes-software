import { EmbeddingModel } from '../../application/embedding.model';

/** Default: no embeddings, so retrieval finds passages by their words only (AST-04). */
export class DisabledEmbeddingModel extends EmbeddingModel {
  name(): string {
    return 'none';
  }

  enabled(): boolean {
    return false;
  }

  embedDocuments(): Promise<number[][]> {
    return Promise.reject(new Error('No embedding model is configured'));
  }

  embedQuery(): Promise<number[]> {
    return Promise.reject(new Error('No embedding model is configured'));
  }
}
