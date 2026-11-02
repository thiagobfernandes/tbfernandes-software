import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type {
  ProjectCategory,
  ProjectColor,
  ProjectStatus,
} from '../../domain';

@Entity({ schema: 'work', name: 'project' })
export class ProjectEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  description: string | null;

  @Column('uuid', { nullable: true })
  companyId: string | null;

  @Column('text')
  category: ProjectCategory;

  @Column('text')
  status: ProjectStatus;

  @Column('text')
  color: ProjectColor;

  @Column('date')
  startDate: string;

  @Column('date', { nullable: true })
  dueDate: string | null;

  @Column('varchar', { nullable: true })
  nextDelivery: string | null;

  /** goals.goal (other module, no FK). */
  @Column('uuid', { nullable: true })
  goalId: string | null;
}
