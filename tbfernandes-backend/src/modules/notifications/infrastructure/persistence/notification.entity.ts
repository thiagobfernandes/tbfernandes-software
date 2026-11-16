import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { NotificationKind } from '../../domain';

@Entity({ schema: 'notifications', name: 'notification' })
export class NotificationEntity extends AuditedEntity {
  @Column('text')
  kind: NotificationKind;

  @Column('varchar')
  title: string;

  @Column('varchar', { nullable: true })
  body: string | null;

  @Column('varchar', { nullable: true })
  href: string | null;

  @Column('varchar')
  dedupeKey: string;

  @Column('timestamptz', { nullable: true })
  readAt: Date | null;
}
