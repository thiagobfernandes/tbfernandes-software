import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { InteractionKind } from '../../domain';

@Entity({ schema: 'contacts', name: 'interaction' })
export class InteractionEntity extends AuditedEntity {
  @Column('uuid')
  contactId: string;

  @Column('date')
  occurredOn: string;

  @Column('text')
  kind: InteractionKind;

  @Column('varchar')
  summary: string;

  /** work.task (other module, no FK). */
  @Column('uuid', { nullable: true })
  followUpTaskId: string | null;
}
