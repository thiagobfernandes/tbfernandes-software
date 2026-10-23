export type EntryKind = "income" | "expense";
/** Business revenue is not the same as personal disposable income. */
export type EntryScope = "personal" | "business";

export type FinanceEntry = {
  id: string;
  kind: EntryKind;
  scope: EntryScope;
  category: string;
  description: string;
  /** In BRL. */
  amount: number;
  date: string;
  recurring: boolean;
};

export type PurchaseGoal = {
  id: string;
  name: string;
  description?: string;
  estimated: number;
  reserved: number;
  /** Planned monthly saving, used for the time-to-goal projection. */
  monthlySaving?: number;
  priority: "low" | "normal" | "high";
  desiredDate?: string;
  goalId?: string;
  status: "planned" | "saving" | "bought";
  paid?: number;
};
