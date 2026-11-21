import { Plane, ShieldCheck } from "lucide-react";

import { ProgressBar } from "@/components/shared/progress-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatMoney,
  formatMonthShort,
} from "@/features/finance/lib/planning-format";
import type { GoalStatus } from "@/features/finance/types/planning";

/**
 * A goal kept apart: the package still owed, the money reserved for spending, what others
 * gave and the emergency reserve that is never counted (RF-PLN-04).
 */
export function GoalCard({ goal }: { goal: GoalStatus }) {
  const progress =
    goal.target && goal.target > 0
      ? Math.min(100, Math.round((goal.reserved / goal.target) * 100))
      : 0;
  return (
    <Card className="gap-3 rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plane className="size-4 text-primary" aria-hidden />
          {goal.name}
        </CardTitle>
        <CardDescription>
          {goal.target !== null
            ? `Meta de ${formatMoney(goal.target)}${goal.targetMonth ? ` até ${formatMonthShort(goal.targetMonth)}` : ""}`
            : "Sem valor de meta"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {goal.target !== null && (
          <div className="flex flex-col gap-1.5">
            <ProgressBar value={progress} label={`${progress}% da meta`} />
            <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>reservado {formatMoney(goal.reserved)}</span>
              <span>falta {formatMoney(goal.remaining ?? 0)}</span>
            </div>
          </div>
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Fact
            label="Guardar por mês"
            value={
              goal.monthlyNeeded === null
                ? "—"
                : formatMoney(goal.monthlyNeeded)
            }
          />
          <Fact
            label="Atinge a meta em"
            value={
              goal.projectedMonth
                ? formatMonthShort(goal.projectedMonth)
                : "fora do horizonte"
            }
          />
          <Fact
            label="Pode gastar na viagem"
            value={formatMoney(goal.reserved)}
            hint="só o que está nesta reserva"
          />
          <Fact
            label={`Contribuição${goal.contributorName ? ` (${goal.contributorName})` : ""}`}
            value={`${formatMoney(goal.contributionsReceived)} recebido`}
            hint={
              goal.expectedContribution
                ? `${formatMoney(goal.expectedContribution)} prometido`
                : "a definir"
            }
          />
          {goal.pending > 0 && (
            <Fact
              label="A receber"
              value={formatMoney(goal.pending)}
              hint="não contado"
            />
          )}
        </dl>
        {goal.package && (
          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs">
            <p className="font-medium">{goal.package.description}</p>
            <p className="text-muted-foreground">
              {formatMoney(goal.package.total)} em {goal.package.installments}x
              no {goal.package.cardName} (
              {formatMonthShort(goal.package.firstMonth)} a{" "}
              {formatMonthShort(goal.package.lastMonth)})
            </p>
            <p className="mt-1 tabular-nums">
              Faltam {goal.package.remainingInstallments} parcelas ·{" "}
              {formatMoney(goal.package.remainingAmount)}
            </p>
          </div>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" aria-hidden />
          Reserva de emergência fora da conta:{" "}
          {formatMoney(goal.protectedReserves)}
        </p>
      </CardContent>
    </Card>
  );
}

function Fact({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
      {hint && <dd className="text-muted-foreground">{hint}</dd>}
    </div>
  );
}
