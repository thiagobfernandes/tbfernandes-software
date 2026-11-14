import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';

@Entity({ schema: 'work', name: 'routine' })
export class RoutineEntity extends AuditedEntity {
  @Column('varchar')
  title: string;

  @Column('varchar', { nullable: true })
  description: string | null;

  @Column('uuid', { nullable: true })
  projectId: string | null;

  @Column('uuid', { nullable: true })
  taskId: string | null;

  @Column('uuid', { nullable: true })
  goalId: string | null;

  @Column('smallint', { array: true })
  weekdays: number[];

  @Column('time', { nullable: true })
  startTime: string | null;

  @Column('int', { nullable: true })
  targetMinutes: number | null;

  @Column('date')
  startDate: string;

  @Column('boolean')
  active: boolean;
}
