import { EmbeddingModel } from '../../application/embedding.model';

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
