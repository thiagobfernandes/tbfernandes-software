import { J, Joi } from '../../../common/protocols';
import { ENTRY_KINDS, ENTRY_SCOPES } from '../domain';
import type { EntryKind, EntryScope } from '../domain';

/** Body of POST and PUT /finance/entries. Amounts in reais, always positive. */
export class EntryRequest {
  /** income | expense */
  kind: string;
  /** personal | business */
  scope: string;
  category: string;
  description: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  recurring?: boolean | null;
}

export interface ValidEntryRequest {
  kind: EntryKind;
  scope: EntryScope;
  category: string;
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
}

export const entryRequestSchema = Joi.object<ValidEntryRequest>({
  kind: J.enumOf(ENTRY_KINDS).required(),
  scope: J.enumOf(ENTRY_SCOPES).required(),
  category: J.requiredText(60),
  description: J.requiredText(300),
  amount: Joi.number().required(),
  date: J.isoDate().required(),
  recurring: Joi.boolean().allow(null).empty(null).default(false),
});

export interface EntryListQuery {
  month: string | null;
  scope: EntryScope | null;
}

export const entryListQuerySchema = Joi.object<EntryListQuery>({
  month: J.yearMonth().default(null),
  scope: J.optionalEnumOf(ENTRY_SCOPES),
  ...J.paging(),
});

export interface CashFlowQuery {
  month: string | null;
  months: number;
  scope: EntryScope | null;
}

export const cashFlowQuerySchema = Joi.object<CashFlowQuery>({
  month: J.yearMonth().default(null),
  months: Joi.number().integer().default(6),
  scope: J.optionalEnumOf(ENTRY_SCOPES),
});

/** Same shape as the frontend's FinanceEntry type. */
export class EntryResponse {
  id: string;
  kind: string;
  scope: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
}

export class MonthTotalsResponse {
  /** YYYY-MM */
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export class CategoryTotalResponse {
  category: string;
  amount: number;
}

/** FIN-02. scope is "all" without a scope filter. */
export class CashFlowResponse {
  month: string;
  scope: string;
  totals: MonthTotalsResponse;
  series: MonthTotalsResponse[];
  expensesByCategory: CategoryTotalResponse[];
}
