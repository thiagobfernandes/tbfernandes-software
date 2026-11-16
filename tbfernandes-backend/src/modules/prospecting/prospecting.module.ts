import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { LeadIngestionService } from './application/lead-ingestion.service';
import { LeadService } from './application/lead.service';
import { LeadMessageRepository, LeadRepository } from './domain';
import { LeadMessageEntity } from './infrastructure/persistence/lead-message.entity';
import { LeadEntity } from './infrastructure/persistence/lead.entity';
import { TypeOrmLeadMessageRepository } from './infrastructure/persistence/typeorm-lead-message.repository';
import { TypeOrmLeadRepository } from './infrastructure/persistence/typeorm-lead.repository';
import { LeadIngestionController } from './web/lead-ingestion.controller';
import { LeadController } from './web/lead.controller';

@Module({
  imports: [DatabaseModule.forFeature([LeadEntity, LeadMessageEntity])],
  controllers: [LeadController, LeadIngestionController],
  providers: [
    LeadService,
    LeadIngestionService,
    { provide: LeadRepository, useClass: TypeOrmLeadRepository },
    { provide: LeadMessageRepository, useClass: TypeOrmLeadMessageRepository },
  ],
})
export class ProspectingModule {}
