import { AssistantTracer } from '../../application/assistant-tracer';
import { EmbeddingModel } from '../../application/embedding.model';
import { postJson } from '../http-json';
import { NO_TRACING } from '../tracing/disabled-tracer';
import { embeddingTraceInput } from './embedding-trace';

export interface OllamaSettings {
  baseUrl: string;
  model: string;
}

interface EmbedResponse {
  embeddings?: number[][] | null;
  prompt_eval_count?: number;
}

const TIMEOUT_MS = 60_000;

export class OllamaEmbeddingModel extends EmbeddingModel {
  constructor(
    private readonly settings: OllamaSettings,
    private readonly http: typeof fetch = fetch,
    private readonly tracer: AssistantTracer = NO_TRACING,
  ) {
    super();
  }

  name(): string {
    return `ollama:${this.settings.model}`;
  }

  enabled(): boolean {
    return true;
  }

  embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embed('embed-documents', texts);
  }

  async embedQuery(question: string): Promise<number[]> {
    return (await this.embed('embed-query', [question]))[0];
  }

  private embed(name: string, texts: string[]): Promise<number[][]> {
    return this.tracer.step(name, 'embedding', async (embedding) => {
      embedding.update({
        model: this.settings.model,
        input: embeddingTraceInput(name, texts),
      });
      const response = await postJson<EmbedResponse>(
        this.http,
        'Ollama',
        `${this.settings.baseUrl.replace(/\/$/, '')}/api/embed`,
        {},
        { model: this.settings.model, input: texts },
        TIMEOUT_MS,
      );
      if (response?.embeddings?.length !== texts.length) {
        throw new Error('Ollama returned no embedding for some of the texts');
      }
      embedding.update({
        output: {
          vectors: response.embeddings.length,
          dimensions: response.embeddings[0]?.length ?? 0,
        },
        usage: { input: response.prompt_eval_count },
      });
      return response.embeddings;
    });
  }
}
