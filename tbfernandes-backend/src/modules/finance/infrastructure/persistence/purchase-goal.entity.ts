import { Column, Entity } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import type { PurchasePriority, PurchaseStatus } from '../../domain';
import { centsColumn } from './money.transformer';

@Entity({ schema: 'finance', name: 'purchase_goal' })
export class PurchaseGoalEntity extends AuditedEntity {
  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  description: string | null;

  @Column('numeric', { transformer: centsColumn })
  estimated: number;

  @Column('numeric', { transformer: centsColumn })
  reserved: number;

  @Column('numeric', { nullable: true, transformer: centsColumn })
  monthlySaving: number | null;

  @Column('text')
  priority: PurchasePriority;

  @Column('date', { nullable: true })
  desiredDate: string | null;

  /** goals.goal (other module, no FK). */
  @Column('uuid', { nullable: true })
  goalId: string | null;

  @Column('text')
  status: PurchaseStatus;

  @Column('numeric', { nullable: true, transformer: centsColumn })
  paid: number | null;
}
