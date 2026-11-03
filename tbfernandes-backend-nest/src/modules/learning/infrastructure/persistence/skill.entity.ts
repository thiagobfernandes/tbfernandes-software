import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';

@Entity({ schema: 'learning', name: 'skill' })
export class SkillEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  @Column('smallint')
  level: number;

  @Column('varchar', { nullable: true })
  evidence: string | null;
}
