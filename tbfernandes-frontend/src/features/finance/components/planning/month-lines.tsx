"use client";

import { useState } from "react";
import { Check, ChevronDown, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatMoney,
  groupLabels,
  groupOrder,
} from "@/features/finance/lib/planning-format";
import type {
  MonthProjection,
  ProjectionLine,
} from "@/features/finance/types/planning";
import { formatShort } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { PaymentDialog, undoPayment } from "./planning-dialogs";
import { CertaintyBadge } from "./planning-ui";

/**
 * Every bill and income of a month on its own line, grouped by kind, with due date, how sure
 * the amount is and whether it was paid. Nothing is lumped into a generic "expenses".
 */
export function MonthLines({
  projection,
  closed,
  onChanged,
}: {
  projection: MonthProjection;
  closed: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const [paying, setPaying] = useState<ProjectionLine>();
  const groups = groupOrder
    .map((group) => ({
      group,
      lines: projection.lines.filter((line) => line.group === group),
    }))
    .filter((item) => item.lines.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma conta neste mês. Cadastre compromissos ou importe faturas.
        </p>
      )}
      {groups.map(({ group, lines }) => {
        const total = lines
          .filter((line) => line.counted)
          .reduce((sum, line) => sum + line.amount, 0);
        return (
          <section key={group} aria-label={groupLabels[group]}>
            <header className="mb-1.5 flex items-baseline justify-between border-b pb-1.5">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {groupLabels[group]}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatMoney(total)}
              </span>
            </header>
            <ul className="flex flex-col">
              {lines.map((line) => (
                <LineRow
                  key={line.key}
                  line={line}
                  closed={closed}
                  onPay={() => setPaying(line)}
                  onUndo={() => undoPayment(line, projection.month, onChanged)}
                />
              ))}
            </ul>
          </section>
        );
      })}
      <PaymentDialog
        line={paying}
        month={projection.month}
        onDone={onChanged}
        onOpenChange={(open) => !open && setPaying(undefined)}
      />
    </div>
  );
}

function LineRow({
  line,
  closed,
  onPay,
  onUndo,
}: {
  line: ProjectionLine;
  closed: boolean;
  onPay: () => void;
  onUndo: () => void;
}) {
  const [open, setOpen] = useState(false);
  const paid = line.paid !== null;
  const hasItems = line.items.length > 0;
  return (
    <li
      className={cn(
        "flex flex-col gap-1 border-b border-border/60 py-2 last:border-0",
        !line.counted && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          disabled={!hasItems}
          onClick={() => setOpen(!open)}
          aria-expanded={hasItems ? open : undefined}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm disabled:cursor-default"
        >
          {hasItems && (
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                !open && "-rotate-90",
              )}
              aria-hidden
            />
          )}
          <span className="truncate font-medium">{line.name}</span>
          {line.installment && (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {line.installment.number}/{line.installment.total ?? "?"}
            </span>
          )}
          {line.last && (
            <span className="shrink-0 rounded bg-success/10 px-1 text-[10px] text-success">
              última
            </span>
          )}
        </button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {line.dueDate
            ? `vence ${formatShort(line.dueDate)}`
            : "sem vencimento"}
        </span>
        <CertaintyBadge certainty={paid ? "confirmed" : line.certainty} />
        <span
          className={cn(
            "w-28 text-right text-sm font-medium tabular-nums",
            line.direction === "income" && "text-success",
            line.certainty === "unknown" && !paid && "text-muted-foreground",
          )}
        >
          {formatMoney(line.amount)}
        </span>
        <PaidAction line={line} closed={closed} onPay={onPay} onUndo={onUndo} />
      </div>
      {(line.note || (paid && line.paid !== line.planned)) && (
        <p className="pl-5 text-xs text-muted-foreground">
          {[
            line.note,
            paid && line.paid !== line.planned
              ? `previsto ${formatMoney(line.planned)}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {open && (
        <ul className="ml-5 flex flex-col gap-0.5 rounded-md bg-muted/40 px-3 py-2 text-xs">
          {line.items.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className="flex justify-between gap-3"
            >
              <span className="truncate">
                {item.date && (
                  <span className="mr-2 text-muted-foreground tabular-nums">
                    {formatShort(item.date)}
                  </span>
                )}
                {item.label}
                {item.kind !== "transaction" && (
                  <span className="ml-1.5 text-muted-foreground">
                    ({item.kind === "inferred" ? "inferida" : "previsão"})
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatMoney(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function PaidAction({
  line,
  closed,
  onPay,
  onUndo,
}: {
  line: ProjectionLine;
  closed: boolean;
  onPay: () => void;
  onUndo: () => void;
}) {
  if (!line.payable) return <span className="w-20" aria-hidden />;
  if (line.paid !== null) {
    return (
      <span className="flex w-20 items-center justify-end gap-1 text-xs text-success">
        <Check className="size-3.5" aria-hidden />
        {line.direction === "income" ? "recebido" : "pago"}
        {!closed && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Desfazer pagamento de ${line.name}`}
            onClick={onUndo}
          >
            <Undo2 />
          </Button>
        )}
      </span>
    );
  }
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-20"
      disabled={closed || line.amount === 0}
      onClick={onPay}
    >
      {line.direction === "income" ? "Recebi" : "Pagar"}
    </Button>
  );
}
