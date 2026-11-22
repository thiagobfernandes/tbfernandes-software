"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/features/finance/lib/planning-format";
import type { ExpenseItem } from "@/features/finance/types/planning";
import { cn } from "@/lib/utils";

import { categoryOf, ExpenseStatusBadge, sumOf } from "./expense-ui";

type Group = { name: string; amount: number; items: ExpenseItem[] };

function groupsOf(items: ExpenseItem[]): Group[] {
  const groups = new Map<string, ExpenseItem[]>();
  for (const item of items.filter((entry) => entry.counted)) {
    const name = categoryOf(item);
    groups.set(name, [...(groups.get(name) ?? []), item]);
  }
  return [...groups.entries()]
    .map(([name, list]) => ({ name, amount: sumOf(list), items: list }))
    .sort((first, second) => second.amount - first.amount);
}

/** Where the month's money goes, by category; each one opens to show what is in it. */
export function ExpenseCategories({ items }: { items: ExpenseItem[] }) {
  const groups = groupsOf(items);
  const total = Math.max(
    groups.reduce((sum, group) => sum + group.amount, 0),
    1,
  );
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Por categoria</CardTitle>
        <CardDescription>
          Cartões, empréstimos e contas do plano, mais o que foi lançado à mão.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nada contado neste mês.
          </p>
        )}
        {groups.map((group) => (
          <CategoryRow key={group.name} group={group} total={total} />
        ))}
      </CardContent>
    </Card>
  );
}

function CategoryRow({ group, total }: { group: Group; total: number }) {
  const [open, setOpen] = useState(false);
  const share = Math.round((group.amount / total) * 100);
  return (
    <div className="border-b border-border/60 py-2 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full flex-col gap-1.5 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="flex items-center gap-2 text-sm">
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              !open && "-rotate-90",
            )}
            aria-hidden
          />
          <span className="flex-1 truncate font-medium">{group.name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {group.items.length} · {share}%
          </span>
          <span className="w-28 text-right font-medium tabular-nums">
            {formatMoney(group.amount)}
          </span>
        </span>
        <span className="ml-5 h-1 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary/70"
            style={{ width: `${share}%` }}
          />
        </span>
      </button>
      {open && (
        <ul className="mt-2 ml-5 flex flex-col gap-1 rounded-md bg-muted/40 px-3 py-2 text-xs">
          {group.items.map((item) => (
            <li key={item.key} className="flex items-center gap-2">
              <span className="flex-1 truncate">{item.name}</span>
              <ExpenseStatusBadge status={item.status} />
              <span className="w-24 text-right tabular-nums">
                {formatMoney(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
