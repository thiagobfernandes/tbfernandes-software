import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { CertificationStatus } from '../../domain';

@Entity({ schema: 'learning', name: 'certification' })
export class CertificationEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  @Column('varchar')
  issuer: string;

  @Column('text')
  status: CertificationStatus;

  @Column('date', { nullable: true })
  obtainedAt: string | null;

  @Column('date', { nullable: true })
  expiresAt: string | null;

  @Column('varchar', { nullable: true })
  validationUrl: string | null;

  @OneToMany(() => CertificationStudyEntity, (link) => link.certification)
  studies?: CertificationStudyEntity[];
}

@Entity({ schema: 'learning', name: 'certification_study' })
export class CertificationStudyEntity {
  @PrimaryColumn('uuid')
  certificationId: string;

  @PrimaryColumn('uuid')
  studyId: string;

  @ManyToOne(
    () => CertificationEntity,
    (certification) => certification.studies,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'certification_id' })
  certification?: CertificationEntity;
}
