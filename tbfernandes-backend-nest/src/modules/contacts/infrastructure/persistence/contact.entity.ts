import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';

@Entity({ schema: 'contacts', name: 'contact' })
export class ContactEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  /** work.company (other module, no FK). */
  @Column('uuid', { nullable: true })
  companyId: string | null;

  @Column('varchar', { nullable: true })
  companyName: string | null;

  @Column('varchar', { nullable: true })
  role: string | null;

  @Column('varchar', { nullable: true })
  email: string | null;

  @Column('varchar', { nullable: true })
  phone: string | null;

  @Column('varchar', { nullable: true })
  profileUrl: string | null;

  @Column('text', { array: true })
  specialties: string[];

  @Column('varchar', { nullable: true })
  context: string | null;

  @Column('date', { nullable: true })
  nextContact: string | null;

  @Column('varchar', { nullable: true })
  notes: string | null;
}
