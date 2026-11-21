"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Repeat,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  EntryScope,
  FinanceEntry,
} from "@/features/finance/types/finance";
import { formatShort } from "@/lib/dates";
import { addMonths, formatBRL, formatMonth } from "@/lib/money";
import { useAppData } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

type ScopeFilter = EntryScope | "all";

const sum = (entries: FinanceEntry[]) =>
  entries.reduce((total, entry) => total + entry.amount, 0);

/** Totals per key, largest first. */
function groupBy(entries: FinanceEntry[], key: (entry: FinanceEntry) => string) {
  return Object.entries(
    entries.reduce<Record<string, { amount: number; count: number }>>(
      (acc, entry) => {
        const group = (acc[key(entry)] ??= { amount: 0, count: 0 });
        group.amount += entry.amount;
        group.count += 1;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b[1].amount - a[1].amount);
}

function daysIn(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

/**
 * Where the money goes: expenses of a month, by category and by merchant, with the
 * comparison to the previous month. Manual and Open Finance entries (card and account).
 */
export function ExpensesPage() {
  const { financeEntries } = useAppData();
  const today = currentDay();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [scope, setScope] = useState<ScopeFilter>("personal");
  const [category, setCategory] = useState<string>();
  const [query, setQuery] = useState("");

  const expenses = financeEntries.filter(
    (entry) =>
      entry.kind === "expense" && (scope === "all" || entry.scope === scope),
  );
  const ofMonth = expenses.filter((entry) => entry.date.startsWith(month));
  const previousMonth = addMonths(month, -1);
  const previous = sum(
    expenses.filter((entry) => entry.date.startsWith(previousMonth)),
  );
  const total = sum(ofMonth);
  const change = previous ? Math.round(((total - previous) / previous) * 100) : null;

  // Average over the days elapsed when the month is the current one.
  const elapsedDays =
    month === today.slice(0, 7) ? Number(today.slice(8, 10)) : daysIn(month);
  const fixed = sum(ofMonth.filter((entry) => entry.recurring));

  const byCategory = groupBy(ofMonth, (entry) => entry.category);
  const byMerchant = groupBy(ofMonth, (entry) => entry.description).slice(0, 8);

  const months = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5));
  const series = months.map((key) => ({
    month: key,
    amount: sum(expenses.filter((entry) => entry.date.startsWith(key))),
  }));
  const maxMonth = Math.max(...series.map((item) => item.amount), 1);

  const needle = query.trim().toLowerCase();
  const listed = ofMonth
    .filter((entry) => !category || entry.category === category)
    .filter(
      (entry) =>
        !needle ||
        entry.description.toLowerCase().includes(needle) ||
        entry.category.toLowerCase().includes(needle),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Gastos"
        description="Para onde vai o dinheiro: cartões, conta e lançamentos manuais."
        actions={<SampleDataBadge />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Mês anterior"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <span
            className="w-28 text-center text-sm font-medium"
            aria-live="polite"
          >
            {formatMonth(month)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Próximo mês"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        <Tabs
          value={scope}
          onValueChange={(value) => setScope(value as ScopeFilter)}
        >
          <TabsList>
            <TabsTrigger value="personal">Pessoal</TabsTrigger>
            <TabsTrigger value="business">Empresa</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <section
        aria-label="Resumo do mês"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Total gasto"
          value={formatBRL(total)}
          visual={
            change === null ? undefined : (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  change > 0 ? "text-destructive" : "text-success",
                )}
                title={`${formatMonth(previousMonth)}: ${formatBRL(previous)}`}
              >
                {change > 0 ? (
                  <TrendingUp className="size-4" aria-hidden />
                ) : (
                  <TrendingDown className="size-4" aria-hidden />
                )}
                {change > 0 ? "+" : ""}
                {change}% vs mês anterior
              </span>
            )
          }
        />
        <MetricCard
          label="Média por dia"
          value={formatBRL(total / Math.max(elapsedDays, 1))}
        />
        <MetricCard
          label="Maior categoria"
          value={byCategory[0]?.[0] ?? "—"}
          unit={byCategory[0] ? formatBRL(byCategory[0][1].amount) : undefined}
        />
        <MetricCard
          label="Fixos (recorrentes)"
          value={formatBRL(fixed)}
          unit={total ? `${Math.round((fixed / total) * 100)}% do total` : undefined}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="gap-4 rounded-lg xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Por categoria</CardTitle>
            <CardDescription>
              Clique numa categoria para filtrar a lista.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum gasto neste mês.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {byCategory.map(([name, group]) => {
                  const active = category === name;
                  return (
                    <li key={name}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCategory(active ? undefined : name)}
                        className={cn(
                          "flex w-full flex-col gap-1 rounded-md px-2 py-1.5 text-left outline-none hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          active && "bg-accent/60",
                        )}
                      >
                        <span className="flex justify-between gap-3 text-sm">
                          <span className="truncate">
                            {name}
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {group.count}
                            </span>
                          </span>
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            {formatBRL(group.amount)} ·{" "}
                            {Math.round((group.amount / total) * 100)}%
                          </span>
                        </span>
                        <span className="h-2 rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-chart-expense"
                            style={{
                              width: `${(group.amount / byCategory[0][1].amount) * 100}%`,
                            }}
                          />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card className="gap-4 rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Últimos seis meses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-end gap-2">
                {series.map((item) => (
                  <button
                    key={item.month}
                    type="button"
                    onClick={() => setMonth(item.month)}
                    aria-pressed={item.month === month}
                    aria-label={`${formatMonth(item.month)}: ${formatBRL(item.amount)}`}
                    title={`${formatMonth(item.month)}: ${formatBRL(item.amount)}`}
                    className={cn(
                      "flex h-full flex-1 flex-col justify-end gap-1 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      item.month === month && "bg-accent/50",
                    )}
                  >
                    <span className="flex flex-1 items-end justify-center">
                      <span
                        className="w-4 rounded-t-[4px] bg-chart-expense"
                        style={{ height: `${(item.amount / maxMonth) * 100}%` }}
                      />
                    </span>
                    <span
                      className={cn(
                        "text-center text-[11px] text-muted-foreground",
                        item.month === month && "font-medium text-foreground",
                      )}
                    >
                      {formatMonth(item.month).slice(0, 3)}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-3 rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Onde mais gastou</CardTitle>
            </CardHeader>
            <CardContent>
              {byMerchant.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum gasto neste mês.
                </p>
              ) : (
                <ol className="flex flex-col gap-2 text-sm">
                  {byMerchant.map(([name, group]) => (
                    <li key={name} className="flex justify-between gap-3">
                      <span className="truncate" title={name}>
                        {name}
                        {group.count > 1 && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {group.count}×
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {formatBRL(group.amount)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="gap-3 rounded-lg">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">
              {category ? `Gastos em ${category}` : "Todos os gastos"}
            </CardTitle>
            <CardDescription>
              {listed.length} · {formatBRL(sum(listed))}
              {category && (
                <button
                  type="button"
                  className="ml-2 underline underline-offset-2"
                  onClick={() => setCategory(undefined)}
                >
                  limpar filtro
                </button>
              )}
            </CardDescription>
          </div>
          <div className="relative sm:w-64">
            <Search
              className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar gasto"
              aria-label="Buscar gasto"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {listed.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">
              Nenhum gasto encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 font-medium">Descrição</th>
                    <th className="px-3 py-2 font-medium">Categoria</th>
                    <th className="px-6 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {listed.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-6 py-2.5 text-muted-foreground tabular-nums">
                        {formatShort(entry.date)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5">
                          {entry.description}
                          {entry.recurring && (
                            <Repeat
                              className="size-3.5 text-muted-foreground"
                              aria-label="Recorrente"
                            />
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {entry.category}
                      </td>
                      <td className="px-6 py-2.5 text-right font-medium tabular-nums">
                        {formatBRL(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
