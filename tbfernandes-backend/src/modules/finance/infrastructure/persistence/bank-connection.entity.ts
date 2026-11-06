import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { AccountType, ConnectionStatus, EntryScope } from '../../domain';
import { centsColumn } from './money.transformer';

@Entity({ schema: 'finance', name: 'bank_connection' })
export class BankConnectionEntity extends AuditedEntity {
  @Column('varchar')
  externalId: string;

  @Column('varchar')
  institution: string;

  @Column('text')
  scope: EntryScope;

  @Column('text')
  status: ConnectionStatus;

  @Column('timestamptz', { nullable: true })
  lastSyncedAt: Date | null;

  @Column('varchar', { nullable: true })
  lastError: string | null;

  /** Read through the relation; replaced by the repository on every save. */
  @OneToMany(() => BankAccountEntity, (account) => account.connection)
  accounts?: BankAccountEntity[];
}

/** Accounts are replaced on every sync, so they have no audit columns. */
@Entity({ schema: 'finance', name: 'bank_account' })
export class BankAccountEntity {
  @PrimaryColumn('uuid')
  connectionId: string;

  @PrimaryColumn('varchar')
  externalId: string;

  @Column('varchar')
  name: string;

  @Column('text')
  type: AccountType;

  @Column('numeric', { nullable: true, transformer: centsColumn })
  balance: number | null;

  @Column('varchar', { nullable: true })
  currency: string | null;

  @ManyToOne(() => BankConnectionEntity, (connection) => connection.accounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'connection_id' })
  connection?: BankConnectionEntity;
}
