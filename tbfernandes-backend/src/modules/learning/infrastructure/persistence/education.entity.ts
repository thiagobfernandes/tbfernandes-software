import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { EducationStatus } from '../../domain';

@Entity({ schema: 'learning', name: 'education' })
export class EducationEntity extends AuditedEntity {
  @Column('varchar')
  institution: string;

  @Column('varchar')
  course: string;

  @Column('varchar')
  degree: string;

  @Column('text')
  status: EducationStatus;

  @Column('date')
  startDate: string;

  @Column('date', { nullable: true })
  endDate: string | null;
}
