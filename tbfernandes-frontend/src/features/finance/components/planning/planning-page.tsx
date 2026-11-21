"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  FlaskConical,
  Lock,
  LockOpen,
  Settings2,
  TableProperties,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeading } from "@/components/shared/page-heading";
import { planningApi } from "@/features/finance/lib/planning-api";
import {
  formatMoney,
  formatMonthLong,
  formatMonthShort,
} from "@/features/finance/lib/planning-format";
import type { PlanOverview } from "@/features/finance/types/planning";
import { formatShort } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { GoalCard } from "./goal-card";
import { MonthLines } from "./month-lines";
import { MonthReportCard } from "./month-report-card";
import { SettingsDialog } from "./planning-dialogs";
import {
  ApiOnly,
  MonthStepper,
  RiskBadge,
  runAction,
  thisMonth,
  useApiResource,
} from "./planning-ui";

export function PlanningPage() {
  return (
    <ApiOnly title="Planejamento">
      <Planning />
    </ApiOnly>
  );
}

function Planning() {
  const [month, setMonth] = useState(thisMonth());
  const loadOverview = useCallback(() => planningApi.overview(month), [month]);
  const loadSettings = useCallback(() => planningApi.settings(), []);
  const overview = useApiResource(loadOverview);
  const settings = useApiResource(loadSettings);
  const reloadAll = useCallback(async () => {
    await Promise.all([overview.reload(), settings.reload()]);
  }, [overview, settings]);

  const closedThrough = settings.data?.closedThrough ?? null;
  const closed = closedThrough !== null && month <= closedThrough;
  const started = month <= thisMonth();

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Planejamento"
        description="Quanto vou receber, quanto preciso pagar, quanto sobra, quanto tenho guardado e quanto falta para as metas."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/finance/projection">
                <TableProperties /> Próximos meses
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/finance/simulator">
                <FlaskConical /> Simular
              </Link>
            </Button>
            <SettingsDialog
              settings={settings.data}
              onDone={reloadAll}
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Configurar planejamento"
                >
                  <Settings2 />
                </Button>
              }
            />
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthStepper month={month} onChange={setMonth} />
        <div className="flex items-center gap-2">
          {overview.data && <RiskBadge risk={overview.data.projection.risk} />}
          {started && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                runAction(
                  () =>
                    closed
                      ? planningApi.reopenFrom(month)
                      : planningApi.closeThrough(month),
                  closed ? "Mês reaberto" : "Mês fechado",
                  reloadAll,
                )
              }
            >
              {closed ? <LockOpen /> : <Lock />}
              {closed ? "Reabrir mês" : "Fechar mês"}
            </Button>
          )}
        </div>
      </div>

      {!overview.data ? (
        <PageSkeleton />
      ) : (
        <OverviewBody
          overview={overview.data}
          closed={closed}
          onChanged={reloadAll}
        />
      )}
    </PageContainer>
  );
}

function OverviewBody({
  overview,
  closed,
  onChanged,
}: {
  overview: PlanOverview;
  closed: boolean;
  onChanged: () => Promise<void>;
}) {
  const { projection } = overview;
  const incomeOf = (salaryOnly: boolean) =>
    projection.lines
      .filter(
        (line) =>
          line.direction === "income" &&
          line.counted &&
          (line.category === "salary") === salaryOnly,
      )
      .reduce((sum, line) => sum + line.amount, 0);
  const salary = incomeOf(true);
  const extras = incomeOf(false);
  const trip = overview.goals.find((goal) => goal.target !== null);

  return (
    <>
      {closed && (
        <p className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          Mês fechado: valores reais travados. Reabra para corrigir algo.
        </p>
      )}
      <section
        aria-label="Resumo do mês"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        <QuestionCard
          question="Quanto vou receber"
          value={formatMoney(projection.income.total)}
          detail={`recebido ${formatMoney(projection.income.received)}`}
          tone="income"
        />
        <QuestionCard
          question="Quanto preciso pagar"
          value={formatMoney(projection.expenses.total)}
          detail={`pago ${formatMoney(projection.expenses.paid)} · falta ${formatMoney(projection.expenses.toPay)}`}
        />
        <QuestionCard
          question="Quanto vai sobrar"
          value={formatMoney(projection.balance)}
          detail={freeToSpendText(projection.balance, projection.safetyMargin)}
          tone={projection.balance < 0 ? "negative" : "positive"}
        />
        <QuestionCard
          question="Quanto tenho guardado"
          value={formatMoney(projection.reserves.confirmed)}
          detail={
            overview.pendingReserves
              ? `+ ${formatMoney(overview.pendingReserves)} a receber (não contado)`
              : "só dinheiro confirmado"
          }
        />
        <QuestionCard
          question={trip ? `Falta para ${trip.name}` : "Metas"}
          value={trip?.remaining != null ? formatMoney(trip.remaining) : "—"}
          detail={
            trip?.monthlyNeeded != null && trip.targetMonth
              ? `${formatMoney(trip.monthlyNeeded)}/mês até ${formatMonthShort(trip.targetMonth)}`
              : "cadastre uma meta em Reservas"
          }
        />
      </section>

      <section
        aria-label="Situação"
        className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4"
      >
        <SmallStat
          label="Salário do mês"
          value={formatMoney(salary)}
          hint={
            extras
              ? `+ ${formatMoney(extras)} em receitas extras`
              : "sem receitas extras"
          }
        />
        <SmallStat
          label="Saldo da conta no fim do mês"
          value={
            projection.accountBalance === null
              ? "não informado"
              : formatMoney(projection.accountBalance)
          }
          hint={
            projection.accountBalance === null
              ? "informe o saldo em Configurar"
              : "previsto, sem contar as reservas"
          }
        />
        <SmallStat
          label="Dívidas em aberto"
          value={formatMoney(projection.debt.known)}
          hint={
            projection.debt.unknown.length
              ? `+ ${projection.debt.unknown.join(", ")} (término desconhecido)`
              : "depois deste mês"
          }
        />
        <SmallStat
          label="Próximo vencimento"
          icon={CalendarClock}
          value={
            overview.nextDue
              ? `${formatMoney(overview.nextDue.amount)}`
              : "nada em aberto"
          }
          hint={
            overview.nextDue
              ? `${overview.nextDue.name} · ${formatShort(overview.nextDue.dueDate ?? "")}`
              : undefined
          }
        />
      </section>

      {projection.warnings.length > 0 && (
        <ul className="flex flex-col gap-1.5 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-xs">
          {projection.warnings.map((warning) => (
            <li key={warning} className="flex gap-2">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-warning"
                aria-hidden
              />
              {warning}
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="gap-3 rounded-lg xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">
              Contas de {formatMonthLong(projection.month)}
            </CardTitle>
            <CardDescription>
              Cada conta com vencimento, valor e se é confirmado, estimado ou
              desconhecido. Compras do cartão já estão na fatura e não somam de
              novo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthLines
              projection={projection}
              closed={closed}
              onChanged={onChanged}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4 xl:col-span-2">
          {overview.goals.map((goal) => (
            <GoalCard key={goal.fundId} goal={goal} />
          ))}
          <MonthReportCard month={projection.month} />
        </div>
      </div>
    </>
  );
}

/** How much more can be spent and still keep the margin (e.g. R$ 1.000) at the end. */
function freeToSpendText(balance: number, margin: number) {
  const free = balance - margin;
  if (margin === 0)
    return `livre para gastar ${formatMoney(Math.max(0, balance))}`;
  return free >= 0
    ? `livre para gastar ${formatMoney(free)} e ainda sobrar ${formatMoney(margin)}`
    : `faltam ${formatMoney(-free)} para sobrar ${formatMoney(margin)}`;
}

function QuestionCard({
  question,
  value,
  detail,
  tone,
}: {
  question: string;
  value: string;
  detail: string;
  tone?: "income" | "positive" | "negative";
}) {
  return (
    <div className="flex min-h-28 flex-col justify-between gap-2 rounded-lg border bg-card p-4">
      <span className="text-xs text-muted-foreground">{question}</span>
      <span
        className={cn(
          "text-2xl font-semibold tracking-tight tabular-nums",
          tone === "income" && "text-primary",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}

function SmallStat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border px-4 py-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
      {hint && (
        <span className="truncate text-xs text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}
