import { toInstant } from '../../../../common/protocols';
import {
  BankConnection,
  CashFlow,
  EntryDetails,
  FinanceEntry,
  Money,
  MonthTotals,
  Projection,
  PurchaseDetails,
  PurchaseGoal,
} from '../../domain';
import type { ConnectionResponse } from '../connection.request';
import type {
  CashFlowResponse,
  EntryResponse,
  MonthTotalsResponse,
  ValidEntryRequest,
} from '../entry.request';
import type {
  ProjectionResponse,
  PurchaseResponse,
  ValidPurchaseRequest,
} from '../purchase.request';

const optionalCents = (value: number | null) =>
  value == null ? null : Money.cents(value);
const optionalNumber = (cents: number | null) =>
  cents == null ? null : Money.toNumber(cents);

/** JSON ↔ FinanceEntry. */
export const EntryMapper = {
  toDetails(r: ValidEntryRequest): EntryDetails {
    return { ...r, amount: Money.cents(r.amount) };
  },

  toResponse(entry: FinanceEntry): EntryResponse {
    const d = entry.details;
    return {
      id: entry.id,
      kind: d.kind.toLowerCase(),
      scope: d.scope.toLowerCase(),
      category: d.category,
      description: d.description,
      amount: Money.toNumber(d.amount),
      date: d.date,
      recurring: d.recurring,
    };
  },
};

function totals(t: MonthTotals): MonthTotalsResponse {
  return {
    month: t.month,
    income: Money.toNumber(t.income),
    expense: Money.toNumber(t.expense),
    balance: Money.toNumber(t.balance),
  };
}

/** CashFlow → JSON. */
export const CashFlowMapper = {
  toResponse(c: CashFlow): CashFlowResponse {
    return {
      month: c.month,
      scope: c.scope?.toLowerCase() ?? 'all',
      totals: totals(c.totals),
      series: c.series.map(totals),
      expensesByCategory: c.expensesByCategory.map((e) => ({
        category: e.category,
        amount: Money.toNumber(e.amount),
      })),
    };
  },
};

/** JSON ↔ PurchaseGoal. */
export const PurchaseMapper = {
  toDetails(r: ValidPurchaseRequest): PurchaseDetails {
    return {
      ...r,
      estimated: Money.cents(r.estimated),
      reserved: optionalCents(r.reserved),
      monthlySaving: optionalCents(r.monthlySaving),
      paid: optionalCents(r.paid),
    };
  },

  toResponse(purchase: PurchaseGoal): PurchaseResponse {
    const d = purchase.details;
    return {
      id: purchase.id,
      name: d.name,
      description: d.description,
      estimated: Money.toNumber(d.estimated),
      reserved: Money.toNumber(purchase.reserved),
      monthlySaving: optionalNumber(d.monthlySaving),
      priority: purchase.priority.toLowerCase(),
      desiredDate: d.desiredDate,
      goalId: d.goalId,
      status: purchase.status.toLowerCase(),
      paid: optionalNumber(d.paid),
    };
  },

  toProjection(p: Projection): ProjectionResponse {
    return { ...p, missing: Money.toNumber(p.missing) };
  },
};

/** BankConnection → JSON. The provider's id stays inside the backend. */
export const ConnectionMapper = {
  toResponse(connection: BankConnection): ConnectionResponse {
    const d = connection.details;
    return {
      id: connection.id,
      institution: d.institution,
      scope: d.scope.toLowerCase(),
      status: d.status.toLowerCase(),
      lastSyncedAt: toInstant(d.lastSyncedAt),
      lastError: d.lastError,
      accounts: d.accounts.map((a) => ({
        externalId: a.externalId,
        name: a.name,
        type: a.type.toLowerCase(),
        balance: optionalNumber(a.balance),
        currency: a.currency,
      })),
    };
  },
};
