import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { LeadIngestionService } from './application/lead-ingestion.service';
import { LeadService } from './application/lead.service';
import { SendRequestService } from './application/send-request.service';
import { WorkerChannel } from './application/worker-channel';
import {
  LeadMessageRepository,
  LeadRepository,
  SendRequestRepository,
} from './domain';
import { InMemoryWorkerChannel } from './infrastructure/channel/in-memory-worker-channel';
import { LeadMessageEntity } from './infrastructure/persistence/lead-message.entity';
import { LeadEntity } from './infrastructure/persistence/lead.entity';
import { SendRequestEntity } from './infrastructure/persistence/send-request.entity';
import { TypeOrmLeadMessageRepository } from './infrastructure/persistence/typeorm-lead-message.repository';
import { TypeOrmLeadRepository } from './infrastructure/persistence/typeorm-lead.repository';
import { TypeOrmSendRequestRepository } from './infrastructure/persistence/typeorm-send-request.repository';
import { IngestKeyGuard } from './web/ingest-key.guard';
import { LeadIngestionController } from './web/lead-ingestion.controller';
import { LeadController } from './web/lead.controller';
import { SendRequestController } from './web/send-request.controller';
import { WorkerController } from './web/worker.controller';

@Module({
  imports: [
    DatabaseModule.forFeature([
      LeadEntity,
      LeadMessageEntity,
      SendRequestEntity,
    ]),
  ],
  controllers: [
    LeadController,
    LeadIngestionController,
    SendRequestController,
    WorkerController,
  ],
  providers: [
    LeadService,
    LeadIngestionService,
    SendRequestService,
    IngestKeyGuard,
    InMemoryWorkerChannel,
    { provide: WorkerChannel, useExisting: InMemoryWorkerChannel },
    { provide: LeadRepository, useClass: TypeOrmLeadRepository },
    { provide: LeadMessageRepository, useClass: TypeOrmLeadMessageRepository },
    { provide: SendRequestRepository, useClass: TypeOrmSendRequestRepository },
  ],
})
export class ProspectingModule {}
