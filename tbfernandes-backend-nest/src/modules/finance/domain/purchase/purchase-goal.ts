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

/** The editable fields of a purchase goal. */
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

/** Something to buy and the money set aside for it (RF-FIN-03). */
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

  /** Rebuilds a purchase goal already stored; no rules run. */
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
    const d = this._details;
    const missing = Math.max(d.estimated - this.reserved, 0);
    if (missing === 0)
      return { missing, ready: true, months: null, month: null, onTime: null };
    if (d.monthlySaving == null)
      return { missing, ready: false, months: null, month: null, onTime: null };
    const months = Math.ceil(missing / d.monthlySaving);
    const month = YearMonths.plusMonths(YearMonths.of(today), months);
    const onTime =
      d.desiredDate == null ? null : month <= YearMonths.of(d.desiredDate);
    return { missing, ready: false, months, month, onTime };
  }

  private static validated(d: PurchaseDetails): PurchaseDetails {
    const reserved = d.reserved ?? 0;
    if (reserved < 0) {
      throw new BusinessRuleViolationError(
        'RN-18',
        'O valor reservado não pode ser negativo',
      );
    }
    const status = d.status ?? 'PLANNED';
    if (status === 'BOUGHT' && d.paid == null) {
      throw new BusinessRuleViolationError(
        'RN-17',
        'Uma compra feita precisa do valor pago',
      );
    }
    return {
      name: Require.text(d.name, 'name', 200),
      description: Require.optionalText(d.description, 'description', 2000),
      estimated: Money.positive(d.estimated, 'estimated'),
      reserved,
      monthlySaving: Money.optionalPositive(d.monthlySaving, 'monthlySaving'),
      priority: d.priority ?? 'NORMAL',
      desiredDate: d.desiredDate ?? null,
      goalId: d.goalId ?? null,
      status,
      paid: Money.optionalPositive(d.paid, 'paid'),
    };
  }
}
