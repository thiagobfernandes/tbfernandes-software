import {
  BusinessRuleViolationError,
  InvalidArgumentError,
  IsoDate,
  NotFoundError,
  Require,
  YearMonth,
  YearMonths,
} from '../../../../common/domain';
import { Cents, Money } from '../money';
import { MonthLock } from './plan-types';

export const FUND_KINDS = ['EMERGENCY', 'TRAVEL', 'GOAL'] as const;
export type FundKind = (typeof FUND_KINDS)[number];

export type MovementKind = 'DEPOSIT' | 'WITHDRAWAL';
/** ACCOUNT moves money between the checking account and the fund; EXTERNAL comes from outside. */
export type MovementSource = 'ACCOUNT' | 'EXTERNAL';
/** EXPECTED is money not received yet (e.g. R$ 300 to receive): never counted as available. */
export type MovementStatus = 'CONFIRMED' | 'EXPECTED';

export interface FundDetails {
  name: string;
  kind: FundKind;
  /** Money that must not be spent, like the emergency reserve. */
  protected: boolean;
  target: Cents | null;
  targetMonth: YearMonth | null;
  /** Promised by someone else and not received yet; zero until defined. */
  expectedContribution: Cents;
  contributorName: string | null;
  /** The installment purchase this fund goes with (the trip package), when there is one. */
  purchaseId: string | null;
}

export interface ReserveMovement {
  id: string;
  date: IsoDate;
  kind: MovementKind;
  source: MovementSource;
  status: MovementStatus;
  amount: Cents;
  contributor: string | null;
  note: string | null;
}

export type MovementInput = Omit<ReserveMovement, 'id'>;

/**
 * Money set aside, kept apart from the checking account (RN-PLN-08). Its balance is the sum
 * of its movements, so the history of deposits and withdrawals is never lost.
 */
export class ReserveFund {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: FundDetails,
    private _movements: ReserveMovement[],
  ) {}

  static create(
    id: string,
    ownerId: string,
    details: FundDetails,
  ): ReserveFund {
    return new ReserveFund(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      ReserveFund.validDetails(details),
      [],
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: FundDetails,
    movements: ReserveMovement[],
  ): ReserveFund {
    return new ReserveFund(id, ownerId, details, ReserveFund.sorted(movements));
  }

  get details(): FundDetails {
    return { ...this._details };
  }

  get movements(): ReserveMovement[] {
    return this._movements.map((movement) => ({ ...movement }));
  }

  update(details: FundDetails): void {
    this._details = ReserveFund.validDetails(details);
  }

  /** Confirmed balance at the end of a month (all of it when no month is given). */
  balance(asOf?: YearMonth): Cents {
    return this.sum(
      (movement) =>
        movement.status === 'CONFIRMED' &&
        (asOf === undefined || YearMonths.of(movement.date) <= asOf),
    );
  }

  /** Balance counting the money still to arrive. */
  potentialBalance(asOf?: YearMonth): Cents {
    return this.sum(
      (movement) => asOf === undefined || YearMonths.of(movement.date) <= asOf,
    );
  }

  pending(): Cents {
    return this.sum((movement) => movement.status === 'EXPECTED');
  }

  contributionsReceived(): Cents {
    return this.sum(
      (movement) =>
        movement.status === 'CONFIRMED' &&
        movement.source === 'EXTERNAL' &&
        movement.contributor !== null,
    );
  }

  addMovement(id: string, input: MovementInput, lock: MonthLock): void {
    const movement = { id, ...ReserveFund.validMovement(input) };
    lock.assertOpen(YearMonths.of(movement.date));
    this._movements = ReserveFund.sorted([...this._movements, movement]);
    this.assertNotOverdrawn();
  }

  updateMovement(id: string, input: MovementInput, lock: MonthLock): void {
    const current = this.requireMovement(id);
    const valid = ReserveFund.validMovement(input);
    lock.assertOpen(YearMonths.of(current.date));
    lock.assertOpen(YearMonths.of(valid.date));
    this._movements = ReserveFund.sorted(
      this._movements.map((movement) =>
        movement.id === id ? { id, ...valid } : movement,
      ),
    );
    this.assertNotOverdrawn();
  }

  removeMovement(id: string, lock: MonthLock): void {
    lock.assertOpen(YearMonths.of(this.requireMovement(id).date));
    this._movements = this._movements.filter((movement) => movement.id !== id);
    this.assertNotOverdrawn();
  }

  private sum(include: (movement: ReserveMovement) => boolean): Cents {
    return this._movements
      .filter(include)
      .reduce(
        (total, movement) =>
          total +
          (movement.kind === 'DEPOSIT' ? movement.amount : -movement.amount),
        0,
      );
  }

  /** A confirmed withdrawal never takes more than what was confirmed before it. */
  private assertNotOverdrawn(): void {
    let running = 0;
    for (const movement of this._movements) {
      if (movement.status !== 'CONFIRMED') continue;
      running +=
        movement.kind === 'DEPOSIT' ? movement.amount : -movement.amount;
      if (running < 0) {
        throw new BusinessRuleViolationError(
          'RN-PLN-08',
          `a retirada de ${movement.date} deixa "${this._details.name}" negativa`,
        );
      }
    }
  }

  private requireMovement(id: string): ReserveMovement {
    const movement = this._movements.find((item) => item.id === id);
    if (!movement) throw new NotFoundError('A movimentação', id);
    return movement;
  }

  private static validDetails(details: FundDetails): FundDetails {
    if (details.expectedContribution < 0) {
      throw new InvalidArgumentError(
        'a contribuição esperada não pode ser negativa',
      );
    }
    return {
      name: Require.text(details.name, 'name', 120),
      kind: Require.present(details.kind, 'kind'),
      protected: details.protected,
      target: Money.optionalPositive(details.target, 'target'),
      targetMonth: details.targetMonth ?? null,
      expectedContribution: details.expectedContribution,
      contributorName: Require.optionalText(
        details.contributorName,
        'contributorName',
        120,
      ),
      purchaseId: details.purchaseId ?? null,
    };
  }

  private static validMovement(input: MovementInput): MovementInput {
    return {
      date: Require.present(input.date, 'date'),
      kind: Require.present(input.kind, 'kind'),
      source: Require.present(input.source, 'source'),
      status: Require.present(input.status, 'status'),
      amount: Money.positive(input.amount, 'amount'),
      contributor: Require.optionalText(input.contributor, 'contributor', 120),
      note: Require.optionalText(input.note, 'note', 300),
    };
  }

  private static sorted(movements: ReserveMovement[]): ReserveMovement[] {
    return [...movements].sort(
      (left, right) =>
        left.date.localeCompare(right.date) || left.id.localeCompare(right.id),
    );
  }
}
