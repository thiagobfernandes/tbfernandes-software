import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { CompanyRelationship, CompanyStatus } from '../../domain';

@Entity({ schema: 'work', name: 'company' })
export class CompanyEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  tradeName: string | null;

  @Column('text')
  relationship: CompanyRelationship;

  @Column('text')
  status: CompanyStatus;

  @Column('varchar', { nullable: true })
  description: string | null;

  @Column('date')
  startDate: string;

  @Column('varchar', { nullable: true })
  mainContact: string | null;
}
