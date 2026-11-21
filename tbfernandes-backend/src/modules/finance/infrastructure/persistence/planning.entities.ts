import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type {
  Certainty,
  CommitmentCategory,
  EntryScope,
  FundKind,
  MovementKind,
  MovementSource,
  MovementStatus,
  StatementSource,
} from '../../domain';
import { centsColumn } from './money.transformer';

@Entity({ schema: 'finance', name: 'planning_settings' })
export class PlanningSettingsEntity extends AuditedEntity {
  @Column('numeric', { transformer: centsColumn })
  safetyMargin: number;

  @Column('numeric', { nullable: true, transformer: centsColumn })
  accountBalance: number | null;

  @Column('date', { nullable: true })
  accountBalanceOn: string | null;

  /** [{label, amount}] with amounts in cents. */
  @Column('jsonb')
  salaryScenarios: { label: string; amount: number }[];

  @Column('varchar', { nullable: true })
  closedThrough: string | null;
}

@Entity({ schema: 'finance', name: 'commitment' })
export class CommitmentEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  @Column('text')
  category: CommitmentCategory;

  @Column('smallint', { nullable: true })
  dueDay: number | null;

  @Column('varchar')
  startMonth: string;

  @Column('varchar', { nullable: true })
  endMonth: string | null;

  @Column('numeric', { nullable: true, transformer: centsColumn })
  total: number | null;

  @Column('uuid', { nullable: true })
  cardId: string | null;

  @Column('varchar', { nullable: true })
  notes: string | null;
}

/** Child rows have no audit columns: they are rewritten with their aggregate. */
@Entity({ schema: 'finance', name: 'commitment_change' })
export class CommitmentChangeEntity {
  @PrimaryColumn('uuid')
  commitmentId: string;

  @PrimaryColumn('varchar')
  fromMonth: string;

  @Column('numeric', { transformer: centsColumn })
  amount: number;

  @Column('boolean')
  active: boolean;

  @Column('text')
  certainty: Certainty;

  @Column('varchar', { nullable: true })
  note: string | null;
}

@Entity({ schema: 'finance', name: 'commitment_month' })
export class CommitmentMonthEntity {
  @PrimaryColumn('uuid')
  commitmentId: string;

  @PrimaryColumn('varchar')
  month: string;

  @Column('numeric', { transformer: centsColumn })
  amount: number;

  @Column('text')
  certainty: Certainty;

  @Column('varchar', { nullable: true })
  note: string | null;
}

@Entity({ schema: 'finance', name: 'commitment_payment' })
export class CommitmentPaymentEntity {
  @PrimaryColumn('uuid')
  commitmentId: string;

  @PrimaryColumn('varchar')
  month: string;

  @Column('numeric', { transformer: centsColumn })
  amount: number;

  @Column('date')
  paidOn: string;
}

@Entity({ schema: 'finance', name: 'credit_card' })
export class CreditCardEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  @Column('text')
  scope: EntryScope;

  @Column('smallint')
  dueDay: number;

  @Column('numeric', { nullable: true, transformer: centsColumn })
  monthlyEstimate: number | null;

  @Column('varchar', { nullable: true })
  estimateFrom: string | null;
}

@Entity({ schema: 'finance', name: 'card_statement' })
export class CardStatementEntity {
  @PrimaryColumn('uuid')
  cardId: string;

  @PrimaryColumn('varchar')
  month: string;

  @Column('date')
  dueDate: string;

  @Column('numeric', { transformer: centsColumn })
  total: number;

  @Column('text')
  source: StatementSource;

  @Column('text')
  certainty: Certainty;

  @Column('numeric', { nullable: true, transformer: centsColumn })
  paidAmount: number | null;

  @Column('date', { nullable: true })
  paidOn: string | null;
}

@Entity({ schema: 'finance', name: 'card_transaction' })
export class CardTransactionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  cardId: string;

  @Column('varchar')
  statementMonth: string;

  @Column('date')
  date: string;

  @Column('varchar')
  title: string;

  /** Normalized title for the dedupe index (RN-PLN-07). */
  @Column('varchar')
  titleKey: string;

  @Column('numeric', { transformer: centsColumn })
  amount: number;

  @Column('smallint', { nullable: true })
  installmentNumber: number | null;

  @Column('smallint', { nullable: true })
  installmentTotal: number | null;

  @Column('smallint')
  occurrence: number;

  @Column('uuid', { nullable: true })
  commitmentId: string | null;
}

@Entity({ schema: 'finance', name: 'card_purchase' })
export class CardPurchaseEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  cardId: string;

  @Column('varchar')
  description: string;

  @Column('numeric', { transformer: centsColumn })
  total: number;

  @Column('smallint')
  installments: number;

  @Column('numeric', { transformer: centsColumn })
  installmentAmount: number;

  @Column('varchar')
  firstMonth: string;

  @Column('boolean')
  withInterest: boolean;
}

@Entity({ schema: 'finance', name: 'reserve_fund' })
export class ReserveFundEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  @Column('text')
  kind: FundKind;

  @Column('boolean')
  protected: boolean;

  @Column('numeric', { nullable: true, transformer: centsColumn })
  target: number | null;

  @Column('varchar', { nullable: true })
  targetMonth: string | null;

  @Column('numeric', { transformer: centsColumn })
  expectedContribution: number;

  @Column('varchar', { nullable: true })
  contributorName: string | null;

  @Column('uuid', { nullable: true })
  purchaseId: string | null;
}

@Entity({ schema: 'finance', name: 'reserve_movement' })
export class ReserveMovementEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  fundId: string;

  @Column('date')
  date: string;

  @Column('text')
  kind: MovementKind;

  @Column('text')
  source: MovementSource;

  @Column('text')
  status: MovementStatus;

  @Column('numeric', { transformer: centsColumn })
  amount: number;

  @Column('varchar', { nullable: true })
  contributor: string | null;

  @Column('varchar', { nullable: true })
  note: string | null;
}

@Entity({ schema: 'finance', name: 'month_snapshot' })
export class MonthSnapshotEntity extends AuditedEntity {
  @Column('varchar')
  month: string;

  @Column('date')
  takenOn: string;

  /** [{key, name, direction, amount, certainty}] with amounts in cents. */
  @Column('jsonb')
  lines: {
    key: string;
    name: string;
    direction: 'INCOME' | 'EXPENSE';
    amount: number;
    certainty: Certainty;
  }[];
}

export const PLANNING_ENTITIES = [
  PlanningSettingsEntity,
  CommitmentEntity,
  CommitmentChangeEntity,
  CommitmentMonthEntity,
  CommitmentPaymentEntity,
  CreditCardEntity,
  CardStatementEntity,
  CardTransactionEntity,
  CardPurchaseEntity,
  ReserveFundEntity,
  ReserveMovementEntity,
  MonthSnapshotEntity,
];
