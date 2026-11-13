import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';

@Entity({ schema: 'work', name: 'time_entry' })
export class TimeEntryEntity extends AuditedEntity {
  @Column('varchar')
  description: string;

  @Column('uuid', { nullable: true })
  projectId: string | null;

  @Column('uuid', { nullable: true })
  taskId: string | null;

  @Column('uuid', { nullable: true })
  routineId: string | null;

  @Column('timestamptz')
  startedAt: Date;

  @Column('timestamptz', { nullable: true })
  endedAt: Date | null;

  @Column('varchar', { nullable: true })
  note: string | null;
}
