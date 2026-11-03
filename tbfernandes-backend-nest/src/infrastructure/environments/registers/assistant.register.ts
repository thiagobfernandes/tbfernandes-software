import { registerAs } from '@nestjs/config';

export type LanguageModelProvider = 'none' | 'anthropic';
export type EmbeddingProvider = 'none' | 'voyage';

/**
 * The assistant's AI providers, both off by default (ADR-005): without them it answers with
 * rules, queries and keyword retrieval. Keys only from the environment.
 */
export interface AssistantConfig {
  model: {
    provider: LanguageModelProvider;
    name: string;
    apiKey: string;
  };
  embedding: {
    provider: EmbeddingProvider;
    name: string;
    baseUrl: string;
    apiKey: string;
  };
}

export const assistantConfig = registerAs('assistant', (): AssistantConfig => ({
  model: {
    provider: (process.env.TBF_ASSISTANT_MODEL ??
      'none') as LanguageModelProvider,
    name: process.env.TBF_ASSISTANT_MODEL_NAME ?? 'claude-opus-5-5',
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  },
  embedding: {
    provider: (process.env.TBF_ASSISTANT_EMBEDDING ??
      'none') as EmbeddingProvider,
    name: process.env.TBF_ASSISTANT_EMBEDDING_NAME ?? 'voyage-3.5-lite',
    baseUrl: process.env.VOYAGE_BASE_URL ?? 'https://api.voyageai.com',
    apiKey: process.env.VOYAGE_API_KEY ?? '',
  },
}));
