import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { WorkModule } from '../work';
import { KnowledgeLookupService } from './application/knowledge-lookup.service';
import { LinkValidator } from './application/link-validator';
import { MethodService } from './application/method.service';
import { NoteService } from './application/note.service';
import { SnippetService } from './application/snippet.service';
import { WorkItemDeletedListener } from './application/work-item-deleted.listener';
import { MethodRepository, NoteRepository, SnippetRepository } from './domain';
import {
  MethodEntity,
  MethodExampleEntity,
  MethodStepEntity,
} from './infrastructure/persistence/method.entity';
import {
  NoteEntity,
  NoteLinkEntity,
} from './infrastructure/persistence/note.entity';
import {
  SnippetEntity,
  SnippetLinkEntity,
} from './infrastructure/persistence/snippet.entity';
import { TypeOrmMethodRepository } from './infrastructure/persistence/typeorm-method.repository';
import { TypeOrmNoteRepository } from './infrastructure/persistence/typeorm-note.repository';
import { TypeOrmSnippetRepository } from './infrastructure/persistence/typeorm-snippet.repository';
import { KnowledgeLookup } from './knowledge.lookup';
import { MethodController } from './web/method.controller';
import { NoteController } from './web/note.controller';
import { SnippetController } from './web/snippet.controller';

@Module({
  imports: [
    WorkModule,
    DatabaseModule.forFeature([
      NoteEntity,
      NoteLinkEntity,
      SnippetEntity,
      SnippetLinkEntity,
      MethodEntity,
      MethodStepEntity,
      MethodExampleEntity,
    ]),
  ],
  controllers: [NoteController, SnippetController, MethodController],
  providers: [
    NoteService,
    SnippetService,
    MethodService,
    LinkValidator,
    KnowledgeLookupService,
    WorkItemDeletedListener,
    { provide: NoteRepository, useClass: TypeOrmNoteRepository },
    { provide: SnippetRepository, useClass: TypeOrmSnippetRepository },
    { provide: MethodRepository, useClass: TypeOrmMethodRepository },
    { provide: KnowledgeLookup, useExisting: KnowledgeLookupService },
  ],
  exports: [KnowledgeLookup],
})
export class KnowledgeModule {}
