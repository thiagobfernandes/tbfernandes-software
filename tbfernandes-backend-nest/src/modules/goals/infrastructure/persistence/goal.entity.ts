import { Column, Entity, ValueTransformer } from 'typeorm';
import { AuditedEntity } from '../../../../infrastructure/database/audited.entity';
import { Decimals } from '../../domain';
import type { GoalArea, GoalPriority, GoalStatus } from '../../domain';

/** numeric(14,2) ↔ hundredths. PostgreSQL sends numeric as text, so nothing is lost. */
const hundredths: ValueTransformer = {
  to: (value: number | null | undefined) =>
    value == null ? value : Decimals.toText(value),
  from: (value: string | null) =>
    value == null ? null : Decimals.hundredths(value),
};

@Entity({ schema: 'goals', name: 'goal' })
export class GoalEntity extends AuditedEntity {
  @Column('uuid', { nullable: true })
  parentId: string | null;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  description: string | null;

  @Column('text')
  area: GoalArea;

  @Column('text')
  status: GoalStatus;

  @Column('text')
  priority: GoalPriority;

  @Column('varchar', { nullable: true })
  currentState: string | null;

  @Column('varchar')
  desiredResult: string;

  @Column('varchar', { nullable: true })
  doneCriteria: string | null;

  @Column('date', { nullable: true })
  dueDate: string | null;

  @Column('varchar', { nullable: true })
  indicatorLabel: string | null;

  @Column('numeric', { nullable: true, transformer: hundredths })
  indicatorCurrent: number | null;

  @Column('numeric', { nullable: true, transformer: hundredths })
  indicatorTarget: number | null;

  @Column('varchar', { nullable: true })
  indicatorUnit: string | null;
}
