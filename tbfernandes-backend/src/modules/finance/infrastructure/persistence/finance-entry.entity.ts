import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { EntryKind, EntryScope, EntrySource } from '../../domain';
import { centsColumn } from './money.transformer';

@Entity({ schema: 'finance', name: 'entry' })
export class FinanceEntryEntity extends AuditedEntity {
  @Column('text')
  kind: EntryKind;

  @Column('text')
  scope: EntryScope;

  @Column('varchar')
  category: string;

  @Column('varchar')
  description: string;

  @Column('numeric', { transformer: centsColumn })
  amount: number;

  @Column('date')
  entryDate: string;

  @Column('boolean')
  recurring: boolean;

  @Column('text')
  source: EntrySource;

  @Column('varchar', { nullable: true })
  externalId: string | null;
}
