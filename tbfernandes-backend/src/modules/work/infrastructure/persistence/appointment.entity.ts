import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';

@Entity({ schema: 'work', name: 'appointment' })
export class AppointmentEntity extends AuditedEntity {
  @Column('varchar')
  title: string;

  @Column('date')
  day: string;

  @Column('time')
  startTime: string;

  @Column('time')
  endTime: string;

  @Column('uuid', { nullable: true })
  taskId: string | null;

  @Column('varchar', { nullable: true })
  note: string | null;
}
