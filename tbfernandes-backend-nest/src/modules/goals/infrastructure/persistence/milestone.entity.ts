import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';

@Entity({ schema: 'goals', name: 'milestone' })
export class MilestoneEntity extends AuditedEntity {
  @Column('uuid')
  goalId: string;

  @Column('varchar')
  title: string;

  @Column('date', { nullable: true })
  dueDate: string | null;

  @Column('boolean')
  done: boolean;
}
