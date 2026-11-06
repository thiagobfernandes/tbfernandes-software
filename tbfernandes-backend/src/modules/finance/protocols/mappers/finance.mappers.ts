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

export const EntryMapper = {
  toDetails(request: ValidEntryRequest): EntryDetails {
    return { ...request, amount: Money.cents(request.amount) };
  },

  toResponse(entry: FinanceEntry): EntryResponse {
    const details = entry.details;
    return {
      id: entry.id,
      kind: details.kind.toLowerCase(),
      scope: details.scope.toLowerCase(),
      category: details.category,
      description: details.description,
      amount: Money.toNumber(details.amount),
      date: details.date,
      recurring: details.recurring,
    };
  },
};

function totals(monthTotals: MonthTotals): MonthTotalsResponse {
  return {
    month: monthTotals.month,
    income: Money.toNumber(monthTotals.income),
    expense: Money.toNumber(monthTotals.expense),
    balance: Money.toNumber(monthTotals.balance),
  };
}

export const CashFlowMapper = {
  toResponse(cashFlow: CashFlow): CashFlowResponse {
    return {
      month: cashFlow.month,
      scope: cashFlow.scope?.toLowerCase() ?? 'all',
      totals: totals(cashFlow.totals),
      series: cashFlow.series.map(totals),
      expensesByCategory: cashFlow.expensesByCategory.map((categoryTotal) => ({
        category: categoryTotal.category,
        amount: Money.toNumber(categoryTotal.amount),
      })),
    };
  },
};

export const PurchaseMapper = {
  toDetails(request: ValidPurchaseRequest): PurchaseDetails {
    return {
      ...request,
      estimated: Money.cents(request.estimated),
      reserved: optionalCents(request.reserved),
      monthlySaving: optionalCents(request.monthlySaving),
      paid: optionalCents(request.paid),
    };
  },

  toResponse(purchase: PurchaseGoal): PurchaseResponse {
    const details = purchase.details;
    return {
      id: purchase.id,
      name: details.name,
      description: details.description,
      estimated: Money.toNumber(details.estimated),
      reserved: Money.toNumber(purchase.reserved),
      monthlySaving: optionalNumber(details.monthlySaving),
      priority: purchase.priority.toLowerCase(),
      desiredDate: details.desiredDate,
      goalId: details.goalId,
      status: purchase.status.toLowerCase(),
      paid: optionalNumber(details.paid),
    };
  },

  toProjection(projection: Projection): ProjectionResponse {
    return { ...projection, missing: Money.toNumber(projection.missing) };
  },
};

/** BankConnection → JSON. The provider's id stays inside the backend. */
export const ConnectionMapper = {
  toResponse(connection: BankConnection): ConnectionResponse {
    const details = connection.details;
    return {
      id: connection.id,
      institution: details.institution,
      scope: details.scope.toLowerCase(),
      status: details.status.toLowerCase(),
      lastSyncedAt: toInstant(details.lastSyncedAt),
      lastError: details.lastError,
      accounts: details.accounts.map((account) => ({
        externalId: account.externalId,
        name: account.name,
        type: account.type.toLowerCase(),
        balance: optionalNumber(account.balance),
        currency: account.currency,
      })),
    };
  },
};
