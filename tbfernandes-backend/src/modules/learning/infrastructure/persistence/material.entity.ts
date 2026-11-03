import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { MaterialStatus, MaterialType } from '../../domain';

@Entity({ schema: 'learning', name: 'material' })
export class MaterialEntity extends AuditedEntity {
  /** FK to learning.study, ON DELETE SET NULL. */
  @Column('uuid', { nullable: true })
  studyId: string | null;

  @Column('varchar')
  title: string;

  @Column('text')
  type: MaterialType;

  @Column('varchar', { nullable: true })
  url: string | null;

  @Column('text')
  status: MaterialStatus;

  @Column('varchar', { nullable: true })
  notes: string | null;
}
