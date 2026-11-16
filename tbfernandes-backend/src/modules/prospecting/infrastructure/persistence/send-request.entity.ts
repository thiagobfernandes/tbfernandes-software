import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { SendableStage, SendRequestStatus } from '../../domain';

@Entity({ schema: 'prospecting', name: 'send_request' })
export class SendRequestEntity extends AuditedEntity {
  @Column('uuid')
  leadId: string;

  @Column('text')
  stage: SendableStage;

  @Column('varchar')
  body: string;

  @Column('text')
  status: SendRequestStatus;

  @Column('timestamptz')
  requestedAt: Date;

  @Column('timestamptz')
  autoSendAt: Date;

  @Column('timestamptz', { nullable: true })
  resolvedAt: Date | null;

  @Column('varchar', { nullable: true })
  error: string | null;
}
