"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Receipt, TableProperties } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { EntryFormDialog } from "@/features/finance/components/finance-form-dialogs";
import { planningApi } from "@/features/finance/lib/planning-api";
import { formatMoney } from "@/features/finance/lib/planning-format";
import type { EntryScope } from "@/features/finance/types/finance";
import type { ExpenseBreakdown } from "@/features/finance/types/planning";
import { useAppData } from "@/lib/sample-data/store";

import {
  ApiOnly,
  MonthStepper,
  thisMonth,
  useApiResource,
} from "../planning/planning-ui";
import { CardStatements } from "./card-statements";
import { ExpenseCategories } from "./expense-categories";
import { ExpenseHistory } from "./expense-history";

type ScopeFilter = EntryScope | "all";

const scopeOptions: { value: ScopeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "personal", label: "Pessoal" },
  { value: "business", label: "Empresa" },
];

/**
 * Every expense of a month in one place: card statements, installments, loans, subscriptions,
 * fixed bills and entries recorded by hand, each with its status (previsto, a pagar, pago,
 * realizado, cancelado). Same totals as Próximos meses, nothing counted twice.
 */
export function ExpensesPage() {
  return (
    <ApiOnly title="Gastos">
      <Suspense fallback={<PageSkeleton />}>
        <Expenses />
      </Suspense>
    </ApiOnly>
  );
}

function useInitialMonth() {
  const fromUrl = useSearchParams().get("month");
  return fromUrl && /^\d{4}-\d{2}$/.test(fromUrl) ? fromUrl : thisMonth();
}

function Expenses() {
  const [month, setMonth] = useState(useInitialMonth());
  const [scope, setScope] = useState<ScopeFilter>("all");
  const load = useCallback(
    () => planningApi.expenses(month, scope === "all" ? null : scope),
    [month, scope],
  );
  const breakdown = useApiResource(load);
  const loadSettings = useCallback(() => planningApi.settings(), []);
  const settings = useApiResource(loadSettings);
  useReloadOnEntries(breakdown.reload);

  const closedThrough = settings.data?.closedThrough ?? null;
  const closed = closedThrough !== null && month <= closedThrough;
  const data = breakdown.data;

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Gastos"
        description="O que você gasta em cada mês: faturas, parcelas, empréstimos, assinaturas, contas e lançamentos, com o que já foi pago e o que ainda é previsão."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/finance/projection">
                <TableProperties /> Próximos meses
              </Link>
            </Button>
            <EntryFormDialog
              trigger={
                <Button size="sm">
                  <Plus /> Novo lançamento
                </Button>
              }
            />
          </>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthStepper month={month} onChange={setMonth} />
        <SegmentedControl
          label="Filtrar por escopo"
          value={scope}
          onChange={setScope}
          options={scopeOptions}
        />
      </div>
      {!data && !breakdown.failed && <PageSkeleton />}
      {data && (
        <MonthExpenses
          data={data}
          scope={scope}
          closed={closed}
          onChanged={breakdown.reload}
        />
      )}
    </PageContainer>
  );
}

/** Entries are written through the store; reload once it has had time to reach the API. */
function useReloadOnEntries(reload: () => Promise<void>) {
  const { financeEntries } = useAppData();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => void reload(), 700);
    return () => clearTimeout(timer);
  }, [financeEntries, reload]);
}

function MonthExpenses({
  data,
  scope,
  closed,
  onChanged,
}: {
  data: ExpenseBreakdown;
  scope: ScopeFilter;
  closed: boolean;
  onChanged: () => Promise<void>;
}) {
  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhum gasto neste mês"
        description="Não há contas no plano nem lançamentos para este mês e este filtro. Cadastre compromissos e cartões ou lance um gasto."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/finance/commitments">Cadastrar compromisso</Link>
          </Button>
        }
        className="py-8"
      />
    );
  }
  return (
    <>
      <Summary data={data} />
      <Reconciliation data={data} scope={scope} />
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ExpenseCategories items={data.items} />
        <ExpenseHistory
          items={data.items}
          month={data.month}
          closed={closed}
          onChanged={onChanged}
        />
      </div>
      <CardStatements items={data.items} />
    </>
  );
}

function Summary({ data }: { data: ExpenseBreakdown }) {
  const { totals } = data;
  const cards = [
    { label: "Total do mês", value: totals.total, always: true },
    { label: "Pago", value: totals.paid, always: true },
    { label: "A pagar", value: totals.pending, always: true },
    { label: "Ainda previsto", value: totals.forecast },
    { label: "Faturas dos cartões", value: totals.cards },
    { label: "Recorrentes", value: totals.recurring },
  ].filter((card) => card.always || card.value > 0);
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <MetricCard
          key={card.label}
          label={card.label}
          value={formatMoney(card.value)}
        />
      ))}
    </section>
  );
}

/** How this screen's total relates to Próximos meses, so the two can be checked. */
function Reconciliation({
  data,
  scope,
}: {
  data: ExpenseBreakdown;
  scope: ScopeFilter;
}) {
  const { totals, reconciliation } = data;
  const parts = [
    scope === "all"
      ? `Contas do plano: ${formatMoney(totals.planned)}, o mesmo total de Próximos meses.`
      : `Contas do plano neste filtro: ${formatMoney(totals.planned)} de ${formatMoney(reconciliation.projection)} no mês.`,
    totals.entries > 0
      ? `Mais ${formatMoney(totals.entries)} lançados fora do plano.`
      : null,
    reconciliation.excludedEntries > 0
      ? `${formatMoney(reconciliation.excludedEntries)} em transferências e pagamentos de fatura não entram, para não contar a fatura duas vezes.`
      : null,
  ].filter(Boolean);
  return (
    <p className="rounded-lg border border-dashed px-4 py-2.5 text-xs text-muted-foreground">
      {parts.join(" ")}
    </p>
  );
}
