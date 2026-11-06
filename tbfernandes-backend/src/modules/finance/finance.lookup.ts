import { YearMonth } from '../../common/domain';

/**
 * A purchase goal with its FIN-04 projection, safe to hold outside the module. Amounts in
 * reais; status in lower case. months is null without a monthly saving.
 */
export interface PurchaseView {
  id: string;
  name: string;
  status: string;
  goalId: string | null;
  estimated: number;
  reserved: number;
  missing: number;
  ready: boolean;
  months: number | null;
  onTime: boolean | null;
}

/** Totals per scope, in reais. Never added together: business revenue is not personal income (RN-12). */
export interface MonthView {
  month: YearMonth;
  personalIncome: number;
  personalExpense: number;
  businessIncome: number;
  businessExpense: number;
}

export abstract class FinanceLookup {
  abstract purchases(ownerId: string): Promise<PurchaseView[]>;
  abstract month(ownerId: string, month: YearMonth): Promise<MonthView>;
}
