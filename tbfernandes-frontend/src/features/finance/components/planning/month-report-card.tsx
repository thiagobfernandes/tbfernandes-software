"use client";

import { useCallback } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { planningApi } from "@/features/finance/lib/planning-api";
import { formatMoney } from "@/features/finance/lib/planning-format";
import type { MonthReport } from "@/features/finance/types/planning";
import { formatShort } from "@/lib/dates";

import { RiskBadge, useApiResource } from "./planning-ui";

/** What changed from last month and planned × actual (RF-PLN-06). */
export function MonthReportCard({ month }: { month: string }) {
  const load = useCallback(() => planningApi.report(month), [month]);
  const { data: report } = useApiResource(load);
  return (
    <Card className="gap-3 rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          Relatório do mês
          {report && <RiskBadge risk={report.risk} />}
        </CardTitle>
        <CardDescription>
          {report?.plannedOn
            ? `Planejado em ${formatShort(report.plannedOn)}`
            : "Comparação com o mês anterior"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        {report ? (
          <ReportBody report={report} />
        ) : (
          <p className="text-muted-foreground">Carregando…</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReportBody({ report }: { report: MonthReport }) {
  return (
    <>
      <dl className="grid grid-cols-3 gap-2 text-xs">
        <Total label="Receber" value={report.income} />
        <Total label="Pagar" value={report.expenses} />
        <Total label="Guardar" value={report.availableToSave} />
      </dl>
      <ChangeList
        title="Aumentaram"
        icon={<TrendingUp className="size-3.5 text-destructive" aria-hidden />}
        items={report.increased}
      />
      <ChangeList
        title="Diminuíram"
        icon={<TrendingDown className="size-3.5 text-success" aria-hidden />}
        items={report.decreased}
      />
      {report.freed.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-medium">Terminaram e liberam</h4>
          {report.freed.map((item) => (
            <p key={item.name} className="flex justify-between text-xs">
              <span>{item.name}</span>
              <span className="text-success tabular-nums">
                +{formatMoney(item.amount)}
              </span>
            </p>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h4 className="text-xs font-medium">Planejado × realizado</h4>
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 text-left font-normal">Conta</th>
              <th className="py-1 text-right font-normal">Planejado</th>
              <th className="py-1 text-right font-normal">Realizado</th>
            </tr>
          </thead>
          <tbody>
            {report.comparison.map((item) => (
              <tr key={item.key} className="border-t border-border/60">
                <td className="py-1">{item.name}</td>
                <td className="py-1 text-right tabular-nums">
                  {formatMoney(item.planned)}
                </td>
                <td className="py-1 text-right tabular-nums">
                  {item.actual === null ? "—" : formatMoney(item.actual)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-medium">
            <tr className="border-t">
              <td className="py-1">Despesas</td>
              <td className="py-1 text-right tabular-nums">
                {formatMoney(report.planned.expenses)}
              </td>
              <td className="py-1 text-right tabular-nums">
                {formatMoney(report.actual.expenses)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{formatMoney(value)}</dd>
    </div>
  );
}

function ChangeList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: MonthReport["increased"];
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <h4 className="flex items-center gap-1.5 text-xs font-medium">
        {icon} {title}
      </h4>
      {items.map((item) => (
        <p key={item.key} className="flex justify-between gap-2 text-xs">
          <span className="truncate">{item.name}</span>
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {formatMoney(item.previous)} → {formatMoney(item.current)}
          </span>
        </p>
      ))}
    </div>
  );
}
