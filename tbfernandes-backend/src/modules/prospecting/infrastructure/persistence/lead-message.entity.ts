import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { MessageDirection, MessageStage } from '../../domain';

@Entity({ schema: 'prospecting', name: 'message' })
export class LeadMessageEntity extends AuditedEntity {
  @Column('uuid')
  leadId: string;

  @Column('text')
  direction: MessageDirection;

  @Column('text')
  stage: MessageStage;

  @Column('varchar')
  body: string;

  @Column('timestamptz')
  sentAt: Date;
}
