import { EmbeddingModel } from '../../application/embedding.model';
import { postJson } from '../http-json';

export interface VoyageSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
}

interface EmbeddingResponse {
  data?: Array<{ index: number; embedding: number[] }> | null;
}

const TIMEOUT_MS = 30_000;

/**
 * Voyage AI embeddings (AST-04), on with TBF_ASSISTANT_EMBEDDING=voyage. Contract: POST
 * /v1/embeddings with {input, model, input_type}, answered with {data: [{embedding, index}]}.
 * input_type tells the model whether the text is a passage to store or a question to search
 * with, which improves retrieval. https://docs.voyageai.com/reference/embeddings-api
 */
export class VoyageEmbeddingModel extends EmbeddingModel {
  constructor(
    private readonly settings: VoyageSettings,
    private readonly http: typeof fetch = fetch,
  ) {
    super();
    if (!settings.apiKey) {
      throw new Error('TBF_ASSISTANT_EMBEDDING=voyage needs VOYAGE_API_KEY');
    }
  }

  name(): string {
    return `voyage:${this.settings.model}`;
  }

  enabled(): boolean {
    return true;
  }

  embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embed(texts, 'document');
  }

  async embedQuery(question: string): Promise<number[]> {
    return (await this.embed([question], 'query'))[0];
  }

  private async embed(texts: string[], inputType: string): Promise<number[][]> {
    const response = await postJson<EmbeddingResponse>(
      this.http,
      'Voyage',
      `${this.settings.baseUrl.replace(/\/$/, '')}/v1/embeddings`,
      { Authorization: `Bearer ${this.settings.apiKey}` },
      { input: texts, model: this.settings.model, input_type: inputType },
      TIMEOUT_MS,
    );
    if (!response?.data || response.data.length !== texts.length) {
      throw new Error('Voyage returned no embedding for some of the texts');
    }
    return [...response.data]
      .sort((a, b) => a.index - b.index)
      .map((e) => e.embedding);
  }
}
