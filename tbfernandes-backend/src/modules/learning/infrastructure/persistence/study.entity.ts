import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { StudyStatus } from '../../domain';

@Entity({ schema: 'learning', name: 'study' })
export class StudyEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  description: string | null;

  @Column('text')
  status: StudyStatus;

  /** goals.goal (other module, no FK). */
  @Column('uuid', { nullable: true })
  goalId: string | null;

  @Column('date', { nullable: true })
  startDate: string | null;

  @Column('date', { nullable: true })
  dueDate: string | null;

  @Column('varchar', { nullable: true })
  nextActivity: string | null;

  @OneToMany(() => StudySkillEntity, (link) => link.study)
  skills?: StudySkillEntity[];
}

@Entity({ schema: 'learning', name: 'study_skill' })
export class StudySkillEntity {
  @PrimaryColumn('uuid')
  studyId: string;

  @PrimaryColumn('uuid')
  skillId: string;

  @ManyToOne(() => StudyEntity, (study) => study.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'study_id' })
  study?: StudyEntity;
}
