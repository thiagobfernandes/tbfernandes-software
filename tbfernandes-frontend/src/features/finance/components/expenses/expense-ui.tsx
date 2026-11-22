"use client";

import {
  expenseStatusLabels,
  groupLabels,
} from "@/features/finance/lib/planning-format";
import type {
  ExpenseItem,
  ExpenseStatus,
} from "@/features/finance/types/planning";
import { cn } from "@/lib/utils";

const statusStyles: Record<ExpenseStatus, string> = {
  paid: "bg-success/10 text-success",
  realized: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  forecast: "border border-dashed text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
};

/** Previsto, a pagar, pago, realizado or cancelado, next to every expense. */
export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] leading-none font-medium",
        statusStyles[status],
      )}
    >
      {expenseStatusLabels[status]}
    </span>
  );
}

/** The plan's group for plan lines; the entry's own category for entries. */
export function categoryOf(item: ExpenseItem): string {
  if (item.group === "manual") return item.category || "Sem categoria";
  return groupLabels[item.group];
}

export const sumOf = (items: ExpenseItem[]) =>
  items.reduce((total, item) => total + item.amount, 0);
