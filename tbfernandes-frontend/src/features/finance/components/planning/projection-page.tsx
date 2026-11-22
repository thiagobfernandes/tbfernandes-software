"use client";

import { useCallback, useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { LineChart } from "@/components/shared/charts";
import { PageHeading } from "@/components/shared/page-heading";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { planningApi } from "@/features/finance/lib/planning-api";
import {
  formatMoney,
  formatMonthShort,
  groupLabels,
  groupOrder,
} from "@/features/finance/lib/planning-format";
import type {
  MonthProjection,
  ProjectionLine,
} from "@/features/finance/types/planning";
import { cn } from "@/lib/utils";

import {
  ApiOnly,
  MonthStepper,
  thisMonth,
  useApiResource,
} from "./planning-ui";

const MONTHS = 13;

export function ProjectionPage() {
  return (
    <ApiOnly title="Próximos meses">
      <Projection />
    </ApiOnly>
  );
}

function Projection() {
  const [from, setFrom] = useState(thisMonth());
  const load = useCallback(() => planningApi.projection(from, MONTHS), [from]);
  const { data: months } = useApiResource(load);

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Próximos meses"
        description="Cada conta mês a mês, quando cada dívida termina e quanto isso libera. Valores em itálico são estimados; “?” é desconhecido."
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">A partir de</span>
        <MonthStepper month={from} onChange={setFrom} />
      </div>
      {!months ? (
        <PageSkeleton />
      ) : (
        <>
          <ProjectionTable months={months} />
          <div className="grid gap-4 xl:grid-cols-2">
            <ScenarioTable months={months} />
            <EvolutionChart months={months} />
          </div>
        </>
      )}
    </PageContainer>
  );
}

type Row = {
  key: string;
  name: string;
  group: ProjectionLine["group"];
  counted: boolean;
};

/** One row per thing (same key every month), grouped like the month view. */
function rowsOf(months: MonthProjection[]): Row[] {
  const rows = new Map<string, Row>();
  for (const month of months) {
    for (const line of month.lines) {
      if (!rows.has(line.key)) {
        rows.set(line.key, {
          key: line.key,
          name: line.name,
          group: line.group,
          counted: line.counted,
        });
      }
    }
  }
  return [...rows.values()];
}

function ProjectionTable({ months }: { months: MonthProjection[] }) {
  const rows = rowsOf(months);
  const lineAt = (month: MonthProjection, key: string) =>
    month.lines.find((line) => line.key === key);

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[64rem] text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b text-muted-foreground">
              <th className="sticky left-0 z-10 bg-card px-4 py-2 text-left font-medium">
                Conta
              </th>
              {months.map((month) => (
                <th
                  key={month.month}
                  className="px-2 py-2 text-right font-medium"
                >
                  {formatMonthShort(month.month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupOrder.map((group) => {
              const groupRows = rows.filter((row) => row.group === group);
              if (groupRows.length === 0) return null;
              return [
                <tr key={group} className="bg-muted/40">
                  <td
                    colSpan={months.length + 1}
                    className="sticky left-0 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {groupLabels[group]}
                  </td>
                </tr>,
                ...groupRows.map((row) => (
                  <tr
                    key={row.key}
                    className={cn(
                      "border-b border-border/50",
                      !row.counted && "opacity-60",
                    )}
                  >
                    <td
                      className="sticky left-0 z-10 max-w-56 truncate bg-card px-4 py-1.5"
                      title={row.name}
                    >
                      {row.name}
                      {!row.counted && (
                        <span className="ml-1 text-muted-foreground">
                          (na fatura)
                        </span>
                      )}
                    </td>
                    {months.map((month) => (
                      <AmountCell
                        key={month.month}
                        line={lineAt(month, row.key)}
                      />
                    ))}
                  </tr>
                )),
              ];
            })}
            <TotalRow
              label="Receitas"
              months={months}
              pick={(month) => month.income.total}
            />
            <TotalRow
              label="Despesas"
              months={months}
              pick={(month) => month.expenses.total}
            />
            <TotalRow
              label="Sobra do mês"
              months={months}
              pick={(month) => month.balance}
              strong
              signed
            />
            <TotalRow
              label={
                months[0]?.safetyMargin
                  ? `Livre para gastar (sobrando ${formatMoney(months[0].safetyMargin)})`
                  : "Livre para gastar"
              }
              months={months}
              pick={(month) => month.balance - month.safetyMargin}
              signed
            />
            <TotalRow
              label="Sobra acumulada"
              months={months}
              pick={(month) => month.accumulated}
              signed
            />
            {months.some((month) => month.accountBalance !== null) && (
              <TotalRow
                label="Saldo da conta"
                months={months}
                pick={(month) => month.accountBalance}
                signed
              />
            )}
            <TotalRow
              label="Reserva confirmada"
              months={months}
              pick={(month) => month.reserves.confirmed}
            />
            <TotalRow
              label="Dívidas restantes"
              months={months}
              pick={(month) => month.debt.known}
            />
            <tr className="border-t">
              <td className="sticky left-0 bg-card px-4 py-1.5 font-medium">
                Libera no orçamento
              </td>
              {months.map((month) => (
                <td
                  key={month.month}
                  className="px-2 py-1.5 text-right align-top text-success"
                >
                  {month.freed.map((item) => (
                    <span key={item.name} className="block" title={item.name}>
                      +{formatMoney(item.amount)}
                    </span>
                  ))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AmountCell({ line }: { line: ProjectionLine | undefined }) {
  if (!line)
    return (
      <td className="px-2 py-1.5 text-right text-muted-foreground/40">—</td>
    );
  const unknown = line.certainty === "unknown" && line.paid === null;
  return (
    <td
      className={cn(
        "px-2 py-1.5 text-right whitespace-nowrap tabular-nums",
        line.certainty === "estimated" &&
          line.paid === null &&
          "text-warning italic",
        unknown && "text-muted-foreground",
        line.direction === "income" && "text-success",
      )}
      title={[line.note, line.paid !== null ? "pago" : null]
        .filter(Boolean)
        .join(" · ")}
    >
      {unknown && line.amount === 0 ? "?" : formatMoney(line.amount)}
      {line.paid !== null && <span className="ml-0.5 text-success">✓</span>}
      {line.last && (
        <span className="ml-1 rounded bg-success/10 px-1 text-[9px] text-success">
          fim
        </span>
      )}
    </td>
  );
}

function TotalRow({
  label,
  months,
  pick,
  strong,
  signed,
}: {
  label: string;
  months: MonthProjection[];
  pick: (month: MonthProjection) => number | null;
  strong?: boolean;
  signed?: boolean;
}) {
  return (
    <tr className={cn("border-t", strong && "bg-muted/30 font-semibold")}>
      <td className="sticky left-0 z-10 bg-card px-4 py-1.5 font-medium">
        {label}
      </td>
      {months.map((month) => {
        const value = pick(month);
        return (
          <td
            key={month.month}
            className={cn(
              "px-2 py-1.5 text-right whitespace-nowrap tabular-nums",
              signed && value !== null && value < 0 && "text-destructive",
            )}
          >
            {value === null ? "—" : formatMoney(value)}
          </td>
        );
      })}
    </tr>
  );
}

/** The month's balance on each salary band (bands are never income). */
function ScenarioTable({ months }: { months: MonthProjection[] }) {
  const labels = months[0]?.scenarios.map((scenario) => scenario.label) ?? [];
  return (
    <Card className="gap-3 rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Sobra por faixa de salário</CardTitle>
        <CardDescription>
          Comparação: aumentos não contam como receita até você registrá-los.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        {labels.length === 0 ? (
          <p className="px-6 text-sm text-muted-foreground">
            Cadastre faixas de salário em Planejamento → Configurar.
          </p>
        ) : (
          <table className="w-full min-w-[36rem] text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-6 py-2 text-left font-medium">Salário</th>
                {months.slice(0, 6).map((month) => (
                  <th
                    key={month.month}
                    className="px-2 py-2 text-right font-medium"
                  >
                    {formatMonthShort(month.month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, index) => (
                <tr key={label} className="border-b border-border/50">
                  <td className="px-6 py-1.5">
                    {label}{" "}
                    <span className="text-muted-foreground">
                      {formatMoney(months[0].scenarios[index].salary)}
                    </span>
                  </td>
                  {months.slice(0, 6).map((month) => {
                    const balance = month.scenarios[index]?.balance ?? 0;
                    return (
                      <td
                        key={month.month}
                        className={cn(
                          "px-2 py-1.5 text-right tabular-nums",
                          balance < 0 && "text-destructive",
                        )}
                      >
                        {formatMoney(balance)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function EvolutionChart({ months }: { months: MonthProjection[] }) {
  const hasAccount = months.some((month) => month.accountBalance !== null);
  return (
    <Card className="gap-3 rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Evolução</CardTitle>
        <CardDescription>
          Reserva confirmada e{" "}
          {hasAccount ? "saldo da conta" : "sobra acumulada"} no fim de cada
          mês.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LineChart
          ariaLabel="Evolução da reserva e do saldo"
          labels={months.map((month) => formatMonthShort(month.month))}
          baseline
          series={[
            {
              label: "Reserva",
              values: months.map((month) => month.reserves.confirmed),
              tone: "stroke-chart-income fill-chart-income",
              area: true,
              format: formatMoney,
            },
            {
              label: hasAccount ? "Saldo da conta" : "Sobra acumulada",
              values: months.map((month) =>
                hasAccount ? (month.accountBalance ?? 0) : month.accumulated,
              ),
              tone: "stroke-primary fill-primary",
              format: formatMoney,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}
