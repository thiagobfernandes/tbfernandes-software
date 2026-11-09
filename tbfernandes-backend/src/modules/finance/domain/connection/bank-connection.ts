import { IsoDate, Require } from '../../../../common/domain';
import { EntryScope, FinanceEntry } from '../entry/finance-entry';
import { Cents } from '../money';

export const CONNECTION_STATUSES = [
  'ACTIVE',
  /** The bank needs the user again: new password, MFA or expired consent. */
  'NEEDS_RECONNECT',
  'ERROR',
] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export type AccountType = 'BANK' | 'CREDIT';

export interface BankAccount {
  externalId: string;
  name: string;
  type: AccountType;
  balance: Cents | null;
  currency: string | null;
}

export interface ConnectionDetails {
  institution: string;
  scope: EntryScope;
  status: ConnectionStatus;
  lastSyncedAt: Date | null;
  lastError: string | null;
  accounts: BankAccount[];
}

const CATEGORY_LENGTH = 60;
const DESCRIPTION_LENGTH = 300;
const ERROR_LENGTH = 300;

/** Provider text is cut to fit instead of failing the whole sync over one long description. */
function fit(
  text: string | null | undefined,
  length: number,
  fallback: string,
) {
  if (text == null || text.trim() === '') return fallback;
  const trimmed = text.trim();
  return trimmed.length <= length ? trimmed : trimmed.slice(0, length).trim();
}

/**
 * One bank login at the open finance provider (RF-FIN-05). Everything imported through it
 * takes its scope (RN-20).
 */
export class BankConnection {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    /** The provider's id (Pluggy item); webhooks only carry this one. */
    readonly externalId: string,
    private _details: ConnectionDetails,
  ) {}

  static connect(
    id: string,
    ownerId: string,
    externalId: string,
    institution: string,
    scope: EntryScope,
    status: ConnectionStatus,
  ): BankConnection {
    return new BankConnection(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Require.text(externalId, 'externalId', 120),
      BankConnection.validated({
        institution,
        scope,
        status,
        lastSyncedAt: null,
        lastError: null,
        accounts: [],
      }),
    );
  }

  static restore(
    id: string,
    ownerId: string,
    externalId: string,
    details: ConnectionDetails,
  ): BankConnection {
    return new BankConnection(id, ownerId, externalId, details);
  }

  get details(): ConnectionDetails {
    const details = this._details;
    return {
      ...details,
      accounts: details.accounts.map((account) => ({ ...account })),
    };
  }

  /**
   * The entry for a settled bank transaction, a positive amount meaning money in. Null for a
   * zero amount, which is not a cash movement.
   */
  importEntry(
    entryId: string,
    externalTransactionId: string,
    date: IsoDate,
    description: string | null,
    signedAmount: Cents,
    category: string | null,
  ): FinanceEntry | null {
    if (signedAmount === 0) return null;
    return FinanceEntry.imported(
      entryId,
      this.ownerId,
      {
        kind: signedAmount > 0 ? 'INCOME' : 'EXPENSE',
        scope: this._details.scope,
        category: fit(category, CATEGORY_LENGTH, 'Sem categoria'),
        description: fit(description, DESCRIPTION_LENGTH, 'Sem descrição'),
        amount: Math.abs(signedAmount),
        date,
        recurring: false,
      },
      externalTransactionId,
    );
  }

  synced(
    institution: string,
    status: ConnectionStatus,
    accounts: BankAccount[],
    at: Date,
  ): void {
    this._details = BankConnection.validated({
      ...this._details,
      institution,
      status,
      lastSyncedAt: at,
      lastError: null,
      accounts,
    });
  }

  /** Keeps what the last good sync knew; only the error is new. */
  syncFailed(error: string | null): void {
    this._details = {
      ...this._details,
      status: 'ERROR',
      lastError: fit(error, ERROR_LENGTH, 'Falha na sincronização'),
    };
  }

  private static validated(details: ConnectionDetails): ConnectionDetails {
    return {
      institution: Require.text(details.institution, 'institution', 200),
      scope: Require.present(details.scope, 'scope'),
      status: Require.present(details.status, 'status'),
      lastSyncedAt: details.lastSyncedAt,
      lastError: details.lastError,
      accounts: [...details.accounts],
    };
  }
}
