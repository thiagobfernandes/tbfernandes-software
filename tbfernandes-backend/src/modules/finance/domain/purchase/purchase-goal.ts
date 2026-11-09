import {
  BusinessRuleViolationError,
  IsoDate,
  Require,
  YearMonth,
  YearMonths,
} from '../../../../common/domain';
import { Cents, Money } from '../money';

export const PURCHASE_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'] as const;
export type PurchasePriority = (typeof PURCHASE_PRIORITIES)[number];

export const PURCHASE_STATUSES = ['PLANNED', 'SAVING', 'BOUGHT'] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export interface PurchaseDetails {
  name: string;
  description: string | null;
  estimated: Cents;
  reserved: Cents | null;
  monthlySaving: Cents | null;
  priority: PurchasePriority | null;
  desiredDate: IsoDate | null;
  /** goals.goal (other module, no FK). */
  goalId: string | null;
  status: PurchaseStatus | null;
  paid: Cents | null;
}

/**
 * FIN-04: money still missing, whether it is all reserved, and when the purchase becomes
 * affordable at the planned monthly saving.
 */
export interface Projection {
  missing: Cents;
  ready: boolean;
  months: number | null;
  month: YearMonth | null;
  onTime: boolean | null;
}

export class PurchaseGoal {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: PurchaseDetails,
  ) {}

  static create(id: string, ownerId: string, details: PurchaseDetails) {
    return new PurchaseGoal(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      PurchaseGoal.validated(details),
    );
  }

  static restore(id: string, ownerId: string, details: PurchaseDetails) {
    return new PurchaseGoal(id, ownerId, details);
  }

  get details(): PurchaseDetails {
    return { ...this._details };
  }

  get reserved(): Cents {
    return this._details.reserved ?? 0;
  }

  get status(): PurchaseStatus {
    return this._details.status ?? 'PLANNED';
  }

  get priority(): PurchasePriority {
    return this._details.priority ?? 'NORMAL';
  }

  update(details: PurchaseDetails): void {
    this._details = PurchaseGoal.validated(details);
  }

  /** Same rule as the frontend's finance/lib/projection.ts. */
  project(today: IsoDate): Projection {
    const details = this._details;
    const missing = Math.max(details.estimated - this.reserved, 0);
    if (missing === 0)
      return { missing, ready: true, months: null, month: null, onTime: null };
    if (details.monthlySaving == null)
      return { missing, ready: false, months: null, month: null, onTime: null };
    const months = Math.ceil(missing / details.monthlySaving);
    const month = YearMonths.plusMonths(YearMonths.of(today), months);
    const onTime =
      details.desiredDate == null
        ? null
        : month <= YearMonths.of(details.desiredDate);
    return { missing, ready: false, months, month, onTime };
  }

  private static validated(details: PurchaseDetails): PurchaseDetails {
    const reserved = details.reserved ?? 0;
    if (reserved < 0) {
      throw new BusinessRuleViolationError(
        'RN-18',
        'O valor reservado não pode ser negativo',
      );
    }
    const status = details.status ?? 'PLANNED';
    if (status === 'BOUGHT' && details.paid == null) {
      throw new BusinessRuleViolationError(
        'RN-17',
        'Uma compra feita precisa do valor pago',
      );
    }
    return {
      name: Require.text(details.name, 'name', 200),
      description: Require.optionalText(
        details.description,
        'description',
        2000,
      ),
      estimated: Money.positive(details.estimated, 'estimated'),
      reserved,
      monthlySaving: Money.optionalPositive(
        details.monthlySaving,
        'monthlySaving',
      ),
      priority: details.priority ?? 'NORMAL',
      desiredDate: details.desiredDate ?? null,
      goalId: details.goalId ?? null,
      status,
      paid: Money.optionalPositive(details.paid, 'paid'),
    };
  }
}
