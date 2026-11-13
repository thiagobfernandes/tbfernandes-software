import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';

@Entity({ schema: 'work', name: 'routine_check' })
export class RoutineCheckEntity extends AuditedEntity {
  @Column('uuid')
  routineId: string;

  @Column('date')
  day: string;

  @Column('varchar', { nullable: true })
  note: string | null;
}
