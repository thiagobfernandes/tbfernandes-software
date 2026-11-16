import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { LeadClassification, LeadStatus } from '../../domain';

@Entity({ schema: 'prospecting', name: 'lead' })
export class LeadEntity extends AuditedEntity {
  @Column('varchar')
  externalId: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  city: string | null;

  @Column('varchar', { nullable: true })
  whatsapp: string | null;

  @Column('varchar', { nullable: true })
  instagram: string | null;

  @Column('varchar', { nullable: true })
  mapsUrl: string | null;

  @Column('text', { nullable: true })
  classification: LeadClassification | null;

  @Column('text')
  status: LeadStatus;

  @Column('varchar', { nullable: true })
  notes: string | null;

  @Column('timestamptz', { nullable: true })
  firstContactAt: Date | null;

  @Column('timestamptz', { nullable: true })
  lastMessageAt: Date | null;

  @Column('timestamptz', { nullable: true })
  lastReplyAt: Date | null;
}
