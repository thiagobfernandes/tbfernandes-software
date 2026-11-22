import {
  InvalidArgumentError,
  IsoDate,
  Require,
  YearMonth,
  YearMonths,
} from '../../../../common/domain';
import { Cents, Money } from '../money';
import { MonthLock } from './plan-types';

export interface SalaryScenario {
  label: string;
  amount: Cents;
}

export interface SettingsDetails {
  /** Kept aside every month before saying how much can be saved. */
  safetyMargin: Cents;
  /** Checking account balance on a day; null when not informed. Never the reserve. */
  accountBalance: Cents | null;
  accountBalanceOn: IsoDate | null;
  /** Salary bands compared in every month; they are never income until recorded. */
  salaryScenarios: SalaryScenario[];
}

/** Planning preferences of one owner, and the months already closed (RN-PLN-01). */
export class PlanningSettings {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: SettingsDetails,
    private _closedThrough: YearMonth | null,
  ) {}

  static defaults(id: string, ownerId: string): PlanningSettings {
    return new PlanningSettings(
      id,
      ownerId,
      {
        safetyMargin: 0,
        accountBalance: null,
        accountBalanceOn: null,
        salaryScenarios: [],
      },
      null,
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: SettingsDetails,
    closedThrough: YearMonth | null,
  ): PlanningSettings {
    return new PlanningSettings(id, ownerId, details, closedThrough);
  }

  get details(): SettingsDetails {
    return {
      ...this._details,
      salaryScenarios: this._details.salaryScenarios.map((item) => ({
        ...item,
      })),
    };
  }

  get closedThrough(): YearMonth | null {
    return this._closedThrough;
  }

  get lock(): MonthLock {
    return MonthLock.through(this._closedThrough);
  }

  update(details: SettingsDetails): void {
    if (details.safetyMargin < 0) {
      throw new InvalidArgumentError(
        'a margem de segurança não pode ser negativa',
      );
    }
    if (
      (details.accountBalance === null) !==
      (details.accountBalanceOn === null)
    ) {
      throw new InvalidArgumentError(
        'informe o saldo da conta junto com a data dele',
      );
    }
    this._details = {
      safetyMargin: details.safetyMargin,
      accountBalance: details.accountBalance,
      accountBalanceOn: details.accountBalanceOn,
      salaryScenarios: details.salaryScenarios.map((scenario) => ({
        label: Require.text(scenario.label, 'label', 60),
        amount: Money.positive(scenario.amount, 'amount'),
      })),
    };
  }

  /** Closes every month up to `month`. Only past or current months can be closed. */
  closeThrough(month: YearMonth, today: IsoDate): void {
    if (month > YearMonths.of(today)) {
      throw new InvalidArgumentError(
        'só dá para fechar meses que já começaram',
      );
    }
    this._closedThrough = month;
  }

  /** Reopens `month` and every month after it. */
  reopenFrom(month: YearMonth): void {
    if (this._closedThrough === null || month > this._closedThrough) return;
    const previous = YearMonths.plusMonths(month, -1);
    this._closedThrough = previous;
  }
}
