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
import { goalHref } from "@/lib/routes";

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
import { priorityLabels } from "@/features/tasks/types/task";
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
    toast.success(`${formatBRL(amount)} reservados para ${purchase.name}`);
  }

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Compras planejadas"
        description="Guarde dinheiro para o que você quer, com uma data clara de quando vai dar para comprar."
        actions={
          <>
            <SampleDataBadge />
            <PurchaseFormDialog
              trigger={
                <Button>
                  <Plus /> Nova compra
                </Button>
              }
            />
          </>
        }
      />

      <section aria-label="Totais" className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Falta guardar" value={formatBRL(totalMissing)} />
        <MetricCard
          label="Economia mensal planejada"
          value={formatBRL(monthly)}
        />
        <MetricCard
          label="Compradas"
          value={bought.length}
          unit={`/ ${purchases.length}`}
        />
      </section>

      {open.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nada planejado"
          description="Adicione algo que você quer comprar e quanto consegue guardar por mês."
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
                      {purchase.status === "saving" ? "Guardando" : "Planejada"}{" "}
                      · prioridade {priorityLabels[purchase.priority]}
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
                      aria-label="Editar compra"
                      onClick={() => setEditing(purchase)}
                    >
                      <Pencil />
                    </Button>
                    <ConfirmDelete
                      noun="compra"
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
                      de {formatBRL(purchase.estimated)}
                    </span>
                  </div>
                  <ProgressBar
                    value={percent}
                    label={`${purchase.name} salva`}
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
                    <span>Valor todo reservado: pronto para comprar.</span>
                  ) : projection.month ? (
                    <span>
                      Dá para comprar em{" "}
                      <strong>{formatMonth(projection.month)}</strong> (
                      {projection.months} meses guardando{" "}
                      {formatBRL(purchase.monthlySaving!)}/mês).
                      {projection.onTime === false && (
                        <span className="block text-xs text-warning">
                          Depois da data desejada,{" "}
                          {formatMonth(purchase.desiredDate!.slice(0, 7))}.
                        </span>
                      )}
                      {projection.onTime && (
                        <span className="block text-xs text-success">
                          Dentro da data desejada.
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {formatBRL(projection.missing)} faltando. Defina uma
                      economia mensal para ver uma data.
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
                    placeholder="Valor"
                    aria-label={`Valor a reservar para ${purchase.name}`}
                    value={deposits[purchase.id] ?? ""}
                    onChange={(event) =>
                      setDeposits((current) => ({
                        ...current,
                        [purchase.id]: event.target.value,
                      }))
                    }
                  />
                  <Button type="submit" variant="outline">
                    <PiggyBank /> Reservar
                  </Button>
                </form>

                <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                  {goal ? (
                    <Link
                      href={goalHref(goal.id)}
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
                      toast.success(`${purchase.name} marcada como comprada`);
                    }}
                  >
                    <Check /> Marcar como comprada
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {bought.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Compradas
          </h2>
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
                    pago {formatBRL(purchase.paid ?? purchase.estimated)}
                  </span>
                  <span
                    className={cn(
                      "w-28 text-right text-xs tabular-nums",
                      difference <= 0 ? "text-success" : "text-warning",
                    )}
                  >
                    {difference <= 0
                      ? `${formatBRL(-difference)} abaixo`
                      : `${formatBRL(difference)} acima`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar compra"
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
