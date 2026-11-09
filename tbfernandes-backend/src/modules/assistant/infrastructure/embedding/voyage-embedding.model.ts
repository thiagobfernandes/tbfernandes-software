import { AssistantTracer } from '../../application/assistant-tracer';
import { EmbeddingModel } from '../../application/embedding.model';
import { postJson } from '../http-json';
import { NO_TRACING } from '../tracing/disabled-tracer';
import { embeddingTraceInput } from './embedding-trace';

export interface VoyageSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
}

interface EmbeddingResponse {
  data?: Array<{ index: number; embedding: number[] }> | null;
  usage?: { total_tokens?: number } | null;
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
    private readonly tracer: AssistantTracer = NO_TRACING,
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
    return this.embed('embed-documents', texts, 'document');
  }

  async embedQuery(question: string): Promise<number[]> {
    return (await this.embed('embed-query', [question], 'query'))[0];
  }

  private embed(
    name: string,
    texts: string[],
    inputType: string,
  ): Promise<number[][]> {
    return this.tracer.step(name, 'embedding', async (embedding) => {
      embedding.update({
        model: this.settings.model,
        input: embeddingTraceInput(name, texts),
        modelParameters: { input_type: inputType },
      });
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
      embedding.update({
        output: { vectors: response.data.length },
        usage: { input: response.usage?.total_tokens },
      });
      return [...response.data]
        .sort((left, right) => left.index - right.index)
        .map((item) => item.embedding);
    });
  }
}
