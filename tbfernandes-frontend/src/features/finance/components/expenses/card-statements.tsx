"use client";

import { CreditCard } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/features/finance/lib/planning-format";
import type { ExpenseItem } from "@/features/finance/types/planning";
import { formatShort } from "@/lib/dates";

import { CertaintyBadge } from "../planning/planning-ui";
import { ExpenseStatusBadge } from "./expense-ui";

const partLabels = { inferred: "inferida", estimate: "previsão" } as const;

/**
 * Each card's statement for the month: the bill to pay, and the purchases inside it shown
 * apart, because they are already in the bill and never added again.
 */
export function CardStatements({ items }: { items: ExpenseItem[] }) {
  const cards = items.filter((item) => item.source === "card");
  if (cards.length === 0) return null;
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Faturas dos cartões</CardTitle>
        <CardDescription>
          O valor a pagar é a fatura. As compras abaixo já estão dentro dela.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatementCard key={card.key} card={card} />
        ))}
      </CardContent>
    </Card>
  );
}

function StatementCard({ card }: { card: ExpenseItem }) {
  const parts = card.items;
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-lg border bg-muted/20 p-3">
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CreditCard
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{card.name}</p>
            <p className="text-xs text-muted-foreground">
              {card.dueDate ? `vence ${formatShort(card.dueDate)}` : ""}
              {card.scope === "business" ? " · empresa" : " · pessoal"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-semibold tabular-nums">
            {formatMoney(card.amount)}
          </span>
          <span className="flex gap-1">
            <CertaintyBadge certainty={card.certainty} />
            <ExpenseStatusBadge status={card.status} />
          </span>
        </div>
      </header>
      {parts.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Sem compras conhecidas nesta fatura.
        </p>
      ) : (
        <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto text-xs">
          {parts.map((part, index) => (
            <li
              key={`${part.label}-${index}`}
              className="flex justify-between gap-3"
            >
              <span className="truncate">
                {part.date && (
                  <span className="mr-2 text-muted-foreground tabular-nums">
                    {formatShort(part.date)}
                  </span>
                )}
                {part.label}
                {part.kind !== "transaction" && (
                  <span className="ml-1.5 text-muted-foreground">
                    ({partLabels[part.kind]})
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatMoney(part.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
