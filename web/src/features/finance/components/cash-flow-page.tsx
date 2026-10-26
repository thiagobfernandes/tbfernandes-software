"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntryFormDialog } from "@/features/finance/components/finance-form-dialogs";
import type {
  EntryScope,
  FinanceEntry,
} from "@/features/finance/types/finance";
import { formatShort } from "@/lib/dates";
import {
  addMonths,
  formatBRL,
  formatBRLCompact,
  formatMonth,
} from "@/lib/money";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

type ScopeFilter = EntryScope | "all";

function totals(entries: FinanceEntry[]) {
  const income = entries
    .filter((entry) => entry.kind === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries
    .filter((entry) => entry.kind === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  return { income, expense, balance: income - expense };
}

export function CashFlowPage() {
  const { financeEntries } = useAppData();
  const [month, setMonth] = useState(currentDay().slice(0, 7));
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [editing, setEditing] = useState<FinanceEntry>();

  const scoped = financeEntries.filter(
    (entry) => scope === "all" || entry.scope === scope,
  );
  const ofMonth = scoped
    .filter((entry) => entry.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));
  const current = totals(ofMonth);
  const savingsRate = current.income
    ? Math.round((current.balance / current.income) * 100)
    : 0;

  const months = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5));
  const series = months.map((key) => ({
    month: key,
    ...totals(scoped.filter((entry) => entry.date.startsWith(key))),
  }));

  const byCategory = Object.entries(
    ofMonth
      .filter((entry) => entry.kind === "expense")
      .reduce<Record<string, number>>((acc, entry) => {
        acc[entry.category] = (acc[entry.category] ?? 0) + entry.amount;
        return acc;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Cash flow"
        description="Income and expenses, with business and personal money kept apart."
        actions={
          <>
            <SampleDataBadge />
            <EntryFormDialog
              trigger={
                <Button>
                  <Plus /> New entry
                </Button>
              }
            />
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
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
            aria-label="Next month"
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
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {scope === "all" && (
        <p className="rounded-xl border border-dashed px-4 py-2.5 text-xs text-muted-foreground">
          &ldquo;All&rdquo; adds business and personal entries together, so
          transfers from the company to you count twice. Use the scope tabs for
          real numbers.
        </p>
      )}

      <section
        aria-label="Month totals"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Income"
          value={formatBRL(current.income)}
          visual={
            <ArrowUpRight className="size-6 text-chart-income" aria-hidden />
          }
        />
        <MetricCard
          label="Expenses"
          value={formatBRL(current.expense)}
          visual={
            <ArrowDownRight className="size-6 text-chart-expense" aria-hidden />
          }
        />
        <MetricCard
          label="Balance"
          value={formatBRL(current.balance)}
          className={cn(current.balance < 0 && "border-destructive/50")}
        />
        <MetricCard label="Saved" value={savingsRate} unit="% of income" />
      </section>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="gap-4 rounded-2xl xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Last six months</CardTitle>
            <CardDescription>Income and expenses per month.</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyBars series={series} selected={month} onSelect={setMonth} />
          </CardContent>
        </Card>
        <Card className="gap-4 rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Expenses by category</CardTitle>
            <CardDescription>{formatMonth(month)}</CardDescription>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No expenses this month.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {byCategory.map(([category, amount]) => (
                  <li
                    key={category}
                    className="flex flex-col gap-1"
                    title={`${category}: ${formatBRL(amount)}`}
                  >
                    <div className="flex justify-between text-sm">
                      <span>{category}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatBRL(amount)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-chart-expense"
                        style={{
                          width: `${(amount / byCategory[0][1]) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Entries</CardTitle>
          <CardDescription>
            {ofMonth.length} in {formatMonth(month)}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {ofMonth.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">
              No entries this month.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Scope</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-6 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ofMonth.map((entry) => (
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
                              aria-label="Recurring"
                            />
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {entry.category}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {entry.scope === "business" ? "Business" : "Personal"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                        <span className="sr-only">
                          {entry.kind === "income" ? "Income" : "Expense"}{" "}
                        </span>
                        <span
                          className={
                            entry.kind === "income" ? "text-success" : undefined
                          }
                        >
                          {entry.kind === "income" ? "+" : "−"}
                          {formatBRL(entry.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit entry"
                            onClick={() => setEditing(entry)}
                          >
                            <Pencil />
                          </Button>
                          <ConfirmDelete
                            noun="entry"
                            name={entry.description}
                            onConfirm={() => {
                              dataActions.remove("financeEntries", entry.id);
                              toast.success("Entry deleted");
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EntryFormDialog
        item={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </PageContainer>
  );
}

type MonthTotals = { month: string; income: number; expense: number };

/** Grouped bars (income vs expense) with a legend and a per-month hover tooltip. */
function MonthlyBars({
  series,
  selected,
  onSelect,
}: {
  series: MonthTotals[];
  selected: string;
  onSelect: (month: string) => void;
}) {
  const [hovered, setHovered] = useState<string>();
  const max = Math.max(
    ...series.flatMap((item) => [item.income, item.expense]),
    1,
  );
  const ticks = [max, max / 2, 0];

  return (
    <div className="flex flex-col gap-3">
      <ul
        className="flex gap-4 text-xs text-muted-foreground"
        aria-label="Legend"
      >
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-chart-income" />{" "}
          Income
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-chart-expense" />{" "}
          Expenses
        </li>
      </ul>
      <div className="flex gap-2">
        <div className="flex h-48 flex-col justify-between pb-6 text-right text-[10px] text-muted-foreground tabular-nums">
          {ticks.map((tick) => (
            <span key={tick}>{formatBRLCompact(Math.round(tick))}</span>
          ))}
        </div>
        <div className="relative flex h-48 flex-1 items-end gap-2">
          {/* Recessive grid lines at the tick values. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
          >
            {ticks.map((tick) => (
              <span
                key={tick}
                className="border-t border-dashed border-border/70"
              />
            ))}
          </div>
          {series.map((item) => {
            const active = item.month === selected;
            const showTip = hovered === item.month;
            return (
              <button
                key={item.month}
                type="button"
                onClick={() => onSelect(item.month)}
                onMouseEnter={() => setHovered(item.month)}
                onMouseLeave={() => setHovered(undefined)}
                onFocus={() => setHovered(item.month)}
                onBlur={() => setHovered(undefined)}
                aria-label={`${formatMonth(item.month)}: income ${formatBRL(item.income)}, expenses ${formatBRL(item.expense)}`}
                aria-pressed={active}
                className={cn(
                  "group/bar relative flex h-full flex-1 flex-col justify-end rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active && "bg-accent/50",
                )}
              >
                <span className="flex h-[calc(100%-1.5rem)] items-end justify-center gap-0.5">
                  <span
                    className="w-3 rounded-t-[4px] bg-chart-income sm:w-4"
                    style={{ height: `${(item.income / max) * 100}%` }}
                  />
                  <span
                    className="w-3 rounded-t-[4px] bg-chart-expense sm:w-4"
                    style={{ height: `${(item.expense / max) * 100}%` }}
                  />
                </span>
                <span
                  className={cn(
                    "h-6 pt-1.5 text-center text-[11px] text-muted-foreground",
                    active && "font-medium text-foreground",
                  )}
                >
                  {formatMonth(item.month).slice(0, 3)}
                </span>
                {showTip && (
                  <span
                    role="tooltip"
                    className="absolute bottom-full left-1/2 z-10 mb-1 flex -translate-x-1/2 flex-col gap-0.5 rounded-lg border bg-popover px-2.5 py-1.5 text-left text-xs whitespace-nowrap shadow-md"
                  >
                    <span className="font-medium">
                      {formatMonth(item.month)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="size-2 rounded-sm bg-chart-income"
                      />
                      Income {formatBRL(item.income)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="size-2 rounded-sm bg-chart-expense"
                      />
                      Expenses {formatBRL(item.expense)}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
