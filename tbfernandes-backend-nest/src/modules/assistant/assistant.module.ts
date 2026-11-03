import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { assistantConfig } from '../../infrastructure/environments/registers';
import { ContactsModule } from '../contacts';
import { FinanceModule } from '../finance';
import { GoalsModule } from '../goals';
import { KnowledgeModule } from '../knowledge';
import { LearningModule } from '../learning';
import { WorkModule } from '../work';
import { AssistantService } from './application/assistant.service';
import { EmbeddingModel } from './application/embedding.model';
import { KnowledgeIndex } from './application/knowledge.index';
import { KnowledgeRetrievalService } from './application/knowledge-retrieval.service';
import { LanguageModel } from './application/language.model';
import { DisabledEmbeddingModel } from './infrastructure/embedding/disabled-embedding.model';
import { VoyageEmbeddingModel } from './infrastructure/embedding/voyage-embedding.model';
import { AnthropicLanguageModel } from './infrastructure/model/anthropic-language.model';
import { DisabledLanguageModel } from './infrastructure/model/disabled-language.model';
import { SqlKnowledgeIndex } from './infrastructure/persistence/sql-knowledge.index';
import { AssistantController } from './web/assistant.controller';

/**
 * Assistant: answers questions over the data of the other modules and builds the knowledge
 * graph, read-only (RN-20). Uses only their public lookups; the language model and the
 * embeddings sit behind LanguageModel and EmbeddingModel, both off by default. Open
 * questions are answered from passages of notes and snippets (RAG, AST-04), kept in the
 * module's own index.
 */
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
    { provide: KnowledgeIndex, useClass: SqlKnowledgeIndex },
    {
      provide: LanguageModel,
      inject: [assistantConfig.KEY],
      useFactory: ({ model }: ConfigType<typeof assistantConfig>) =>
        model.provider === 'anthropic'
          ? new AnthropicLanguageModel({
              model: model.name,
              apiKey: model.apiKey,
            })
          : new DisabledLanguageModel(),
    },
    {
      provide: EmbeddingModel,
      inject: [assistantConfig.KEY],
      useFactory: ({ embedding }: ConfigType<typeof assistantConfig>) =>
        embedding.provider === 'voyage'
          ? new VoyageEmbeddingModel({
              baseUrl: embedding.baseUrl,
              model: embedding.name,
              apiKey: embedding.apiKey,
            })
          : new DisabledEmbeddingModel(),
    },
  ],
})
export class AssistantModule {}
