"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Check,
  PiggyBank,
  Pencil,
  Plus,
  ShoppingCart,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PurchaseFormDialog } from "@/features/finance/components/finance-form-dialogs";
import { projectPurchase } from "@/features/finance/lib/projection";
import type { PurchaseGoal } from "@/features/finance/types/finance";
import { formatBRL, formatMonth } from "@/lib/money";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

export function PurchasesPage() {
  const { purchases, goals } = useAppData();
  const [editing, setEditing] = useState<PurchaseGoal>();
  const [deposits, setDeposits] = useState<Record<string, string>>({});

  const open = purchases.filter((purchase) => purchase.status !== "bought");
  const bought = purchases.filter((purchase) => purchase.status === "bought");
  const totalMissing = open.reduce(
    (sum, purchase) =>
      sum + Math.max(0, purchase.estimated - purchase.reserved),
    0,
  );
  const monthly = open.reduce(
    (sum, purchase) => sum + (purchase.monthlySaving ?? 0),
    0,
  );

  function deposit(purchase: PurchaseGoal) {
    const amount = Number(deposits[purchase.id]);
    if (!amount || amount <= 0) return;
    dataActions.update("purchases", purchase.id, {
      reserved: purchase.reserved + amount,
      status: purchase.status === "planned" ? "saving" : purchase.status,
    });
    setDeposits((current) => ({ ...current, [purchase.id]: "" }));
    toast.success(`${formatBRL(amount)} reserved for ${purchase.name}`);
  }

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Planned purchases"
        description="Save for what you want with a clear date for when it becomes affordable."
        actions={
          <>
            <SampleDataBadge />
            <PurchaseFormDialog
              trigger={
                <Button>
                  <Plus /> New purchase
                </Button>
              }
            />
          </>
        }
      />

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Still to save" value={formatBRL(totalMissing)} />
        <MetricCard label="Planned monthly saving" value={formatBRL(monthly)} />
        <MetricCard
          label="Bought"
          value={bought.length}
          unit={`/ ${purchases.length}`}
        />
      </section>

      {open.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nothing planned"
          description="Add something you want to buy and how much you can save per month."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {open.map((purchase) => {
            const projection = projectPurchase(purchase);
            const percent = Math.round(
              (purchase.reserved / purchase.estimated) * 100,
            );
            const goal = goals.find((item) => item.id === purchase.goalId);
            return (
              <article
                key={purchase.id}
                className="flex flex-col gap-4 rounded-2xl border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase">
                      {purchase.status === "saving" ? "Saving" : "Planned"} ·{" "}
                      {purchase.priority} priority
                    </span>
                    <h2 className="font-medium">{purchase.name}</h2>
                    {purchase.description && (
                      <p className="text-sm text-muted-foreground">
                        {purchase.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit purchase"
                      onClick={() => setEditing(purchase)}
                    >
                      <Pencil />
                    </Button>
                    <ConfirmDelete
                      noun="purchase"
                      name={purchase.name}
                      onConfirm={() =>
                        dataActions.remove("purchases", purchase.id)
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-light tabular-nums">
                      {formatBRL(purchase.reserved)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatBRL(purchase.estimated)}
                    </span>
                  </div>
                  <ProgressBar
                    value={percent}
                    label={`${purchase.name} saved`}
                    className="h-2"
                  />
                </div>

                <div
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                    projection.ready && "border-success/50 text-success",
                    projection.onTime === false && "border-warning/50",
                  )}
                >
                  <CalendarClock
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  {projection.ready ? (
                    <span>Fully reserved: ready to buy.</span>
                  ) : projection.month ? (
                    <span>
                      Affordable in{" "}
                      <strong>{formatMonth(projection.month)}</strong> (
                      {projection.months} months at{" "}
                      {formatBRL(purchase.monthlySaving!)}/month).
                      {projection.onTime === false && (
                        <span className="block text-xs text-warning">
                          Later than the desired{" "}
                          {formatMonth(purchase.desiredDate!.slice(0, 7))}.
                        </span>
                      )}
                      {projection.onTime && (
                        <span className="block text-xs text-success">
                          On time for the desired date.
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {formatBRL(projection.missing)} missing. Set a monthly
                      saving to see a date.
                    </span>
                  )}
                </div>

                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    deposit(purchase);
                  }}
                >
                  <Input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="Amount"
                    aria-label={`Amount to reserve for ${purchase.name}`}
                    value={deposits[purchase.id] ?? ""}
                    onChange={(event) =>
                      setDeposits((current) => ({
                        ...current,
                        [purchase.id]: event.target.value,
                      }))
                    }
                  />
                  <Button type="submit" variant="outline">
                    <PiggyBank /> Reserve
                  </Button>
                </form>

                <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                  {goal ? (
                    <Link
                      href={`/goals/${goal.id}`}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <Target className="size-3.5" aria-hidden /> {goal.name}
                    </Link>
                  ) : (
                    <span />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      dataActions.update("purchases", purchase.id, {
                        status: "bought",
                        paid: purchase.paid ?? purchase.estimated,
                      });
                      toast.success(`${purchase.name} marked as bought`);
                    }}
                  >
                    <Check /> Mark bought
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {bought.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Bought</h2>
          <ul className="flex flex-col divide-y rounded-2xl border bg-card">
            {bought.map((purchase) => {
              const difference =
                (purchase.paid ?? purchase.estimated) - purchase.estimated;
              return (
                <li
                  key={purchase.id}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                >
                  <Check className="size-4 text-success" aria-hidden />
                  <span className="flex-1">{purchase.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    paid {formatBRL(purchase.paid ?? purchase.estimated)}
                  </span>
                  <span
                    className={cn(
                      "w-28 text-right text-xs tabular-nums",
                      difference <= 0 ? "text-success" : "text-warning",
                    )}
                  >
                    {difference <= 0
                      ? `${formatBRL(-difference)} under`
                      : `${formatBRL(difference)} over`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit purchase"
                    onClick={() => setEditing(purchase)}
                  >
                    <Pencil />
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <PurchaseFormDialog
        item={editing}
        open={Boolean(editing)}
        onOpenChange={(isOpen) => !isOpen && setEditing(undefined)}
      />
    </PageContainer>
  );
}
