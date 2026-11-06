import { registerAs } from '@nestjs/config';

export type LanguageModelProvider = 'none' | 'anthropic' | 'openai-compatible';
export type EmbeddingProvider = 'none' | 'voyage' | 'ollama';
export type TracingProvider = 'none' | 'langfuse';

const DEFAULT_MODEL_NAMES: Record<LanguageModelProvider, string> = {
  none: 'claude-opus-5-5',
  anthropic: 'claude-opus-5-5',
  'openai-compatible': 'openai/gpt-oss-120b',
};

const DEFAULT_EMBEDDING_NAMES: Record<EmbeddingProvider, string> = {
  none: 'voyage-3.5-lite',
  voyage: 'voyage-3.5-lite',
  ollama: 'bge-m3',
};

/**
 * The assistant's AI providers, both off by default (ADR-005): without them it answers with
 * rules, queries and keyword retrieval. Keys only from the environment. Empty values (as
 * compose passes unset ones) take the default.
 */
export interface AssistantConfig {
  model: {
    provider: LanguageModelProvider;
    name: string;
    baseUrl: string;
    apiKey: string;
  };
  embedding: {
    provider: EmbeddingProvider;
    name: string;
    baseUrl: string;
    apiKey: string;
  };
  tracing: {
    provider: TracingProvider;
    publicKey: string;
    secretKey: string;
    baseUrl: string;
    environment: string;
  };
}

function languageModel(): AssistantConfig['model'] {
  const provider = (process.env.TBF_ASSISTANT_MODEL ||
    'none') as LanguageModelProvider;
  return {
    provider,
    name: process.env.TBF_ASSISTANT_MODEL_NAME || DEFAULT_MODEL_NAMES[provider],
    baseUrl:
      process.env.TBF_ASSISTANT_MODEL_BASE_URL ||
      'https://api.groq.com/openai/v1',
    apiKey:
      (provider === 'anthropic'
        ? process.env.ANTHROPIC_API_KEY
        : process.env.TBF_ASSISTANT_MODEL_API_KEY) ?? '',
  };
}

function embeddingModel(): AssistantConfig['embedding'] {
  const provider = (process.env.TBF_ASSISTANT_EMBEDDING ||
    'none') as EmbeddingProvider;
  const ollama = provider === 'ollama';
  return {
    provider,
    name:
      process.env.TBF_ASSISTANT_EMBEDDING_NAME ||
      DEFAULT_EMBEDDING_NAMES[provider],
    baseUrl: ollama
      ? process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      : process.env.VOYAGE_BASE_URL || 'https://api.voyageai.com',
    apiKey: ollama ? '' : (process.env.VOYAGE_API_KEY ?? ''),
  };
}

function tracing(): AssistantConfig['tracing'] {
  return {
    provider: (process.env.TBF_ASSISTANT_TRACING || 'none') as TracingProvider,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? '',
    secretKey: process.env.LANGFUSE_SECRET_KEY ?? '',
    baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    environment: process.env.TBF_PROFILE || 'dev',
  };
}

export const assistantConfig = registerAs('assistant', (): AssistantConfig => ({
  model: languageModel(),
  embedding: embeddingModel(),
  tracing: tracing(),
}));
