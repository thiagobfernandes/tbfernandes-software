import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { assistantConfig } from '../../infrastructure/environments/registers';
import { ContactsModule } from '../contacts';
import { FinanceModule } from '../finance';
import { GoalsModule } from '../goals';
import { KnowledgeModule } from '../knowledge';
import { LearningModule } from '../learning';
import { WorkModule } from '../work';
import { AssistantTracer } from './application/assistant-tracer';
import { AssistantService } from './application/assistant.service';
import { EmbeddingModel } from './application/embedding.model';
import { KnowledgeIndex } from './application/knowledge.index';
import { KnowledgeRetrievalService } from './application/knowledge-retrieval.service';
import { LanguageModel } from './application/language.model';
import { WorkspaceReader } from './application/workspace-reader';
import { DisabledEmbeddingModel } from './infrastructure/embedding/disabled-embedding.model';
import { OllamaEmbeddingModel } from './infrastructure/embedding/ollama-embedding.model';
import { VoyageEmbeddingModel } from './infrastructure/embedding/voyage-embedding.model';
import { AnthropicLanguageModel } from './infrastructure/model/anthropic-language.model';
import { DisabledLanguageModel } from './infrastructure/model/disabled-language.model';
import { OpenAiCompatibleLanguageModel } from './infrastructure/model/openai-compatible-language.model';
import { SqlKnowledgeIndex } from './infrastructure/persistence/sql-knowledge.index';
import { DisabledTracer } from './infrastructure/tracing/disabled-tracer';
import { LangfuseTracer } from './infrastructure/tracing/langfuse-tracer';
import { AssistantController } from './web/assistant.controller';

type AssistantSettings = ConfigType<typeof assistantConfig>;

function tracerOf({ tracing }: AssistantSettings): AssistantTracer {
  return tracing.provider === 'langfuse'
    ? new LangfuseTracer({
        publicKey: tracing.publicKey,
        secretKey: tracing.secretKey,
        baseUrl: tracing.baseUrl,
        environment: tracing.environment,
      })
    : new DisabledTracer();
}

function languageModelOf(
  { model }: AssistantSettings,
  tracer: AssistantTracer,
): LanguageModel {
  switch (model.provider) {
    case 'anthropic':
      return new AnthropicLanguageModel(
        { model: model.name, apiKey: model.apiKey },
        undefined,
        tracer,
      );
    case 'openai-compatible':
      return new OpenAiCompatibleLanguageModel(
        { baseUrl: model.baseUrl, model: model.name, apiKey: model.apiKey },
        fetch,
        tracer,
      );
    default:
      return new DisabledLanguageModel();
  }
}

function embeddingModelOf(
  { embedding }: AssistantSettings,
  tracer: AssistantTracer,
): EmbeddingModel {
  switch (embedding.provider) {
    case 'voyage':
      return new VoyageEmbeddingModel(
        {
          baseUrl: embedding.baseUrl,
          model: embedding.name,
          apiKey: embedding.apiKey,
        },
        fetch,
        tracer,
      );
    case 'ollama':
      return new OllamaEmbeddingModel(
        { baseUrl: embedding.baseUrl, model: embedding.name },
        fetch,
        tracer,
      );
    default:
      return new DisabledEmbeddingModel();
  }
}

@Module({
  imports: [
    WorkModule,
    KnowledgeModule,
    GoalsModule,
    LearningModule,
    FinanceModule,
    ContactsModule,
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    KnowledgeRetrievalService,
    WorkspaceReader,
    { provide: KnowledgeIndex, useClass: SqlKnowledgeIndex },
    {
      provide: AssistantTracer,
      inject: [assistantConfig.KEY],
      useFactory: tracerOf,
    },
    {
      provide: LanguageModel,
      inject: [assistantConfig.KEY, AssistantTracer],
      useFactory: languageModelOf,
    },
    {
      provide: EmbeddingModel,
      inject: [assistantConfig.KEY, AssistantTracer],
      useFactory: embeddingModelOf,
    },
  ],
})
export class AssistantModule {}
