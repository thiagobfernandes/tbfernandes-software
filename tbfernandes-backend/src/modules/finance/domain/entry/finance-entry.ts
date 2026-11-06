import { IsoDate, Require } from '../../../../common/domain';
import { Cents, Money } from '../money';

export const ENTRY_KINDS = ['INCOME', 'EXPENSE'] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export const ENTRY_SCOPES = ['PERSONAL', 'BUSINESS'] as const;
export type EntryScope = (typeof ENTRY_SCOPES)[number];

export type EntrySource = 'MANUAL' | 'OPEN_FINANCE';

/** The editable fields of an entry. The amount is always positive; kind gives the direction. */
export interface EntryDetails {
  kind: EntryKind;
  scope: EntryScope;
  category: string;
  description: string;
  amount: Cents;
  date: IsoDate;
  recurring: boolean;
}

/**
 * Income or expense (RF-FIN-01). Business revenue is not personal income, so every entry has
 * a scope (RN-12).
 */
export class FinanceEntry {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: EntryDetails,
    readonly source: EntrySource,
    /** Provider transaction id of an imported entry; keeps imports idempotent (RN-16). */
    readonly externalId: string | null,
  ) {}

  static create(id: string, ownerId: string, details: EntryDetails) {
    return new FinanceEntry(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      FinanceEntry.validated(details),
      'MANUAL',
      null,
    );
  }

  static imported(
    id: string,
    ownerId: string,
    details: EntryDetails,
    externalId: string,
  ) {
    return new FinanceEntry(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      FinanceEntry.validated(details),
      'OPEN_FINANCE',
      Require.text(externalId, 'externalId', 120),
    );
  }

  static restore(
    id: string,
    ownerId: string,
    details: EntryDetails,
    source: EntrySource,
    externalId: string | null,
  ) {
    return new FinanceEntry(id, ownerId, details, source, externalId);
  }

  get details(): EntryDetails {
    return { ...this._details };
  }

  update(details: EntryDetails): void {
    this._details = FinanceEntry.validated(details);
  }

  private static validated(details: EntryDetails): EntryDetails {
    return {
      kind: Require.present(details.kind, 'kind'),
      scope: Require.present(details.scope, 'scope'),
      category: Require.text(details.category, 'category', 60),
      description: Require.text(details.description, 'description', 300),
      amount: Money.positive(details.amount, 'amount'),
      date: Require.present(details.date, 'date'),
      recurring: details.recurring ?? false,
    };
  }
}

export function totalOf(entries: readonly FinanceEntry[], kind: EntryKind) {
  return entries
    .filter((entry) => entry.details.kind === kind)
    .reduce((sum, entry) => sum + entry.details.amount, 0);
}
