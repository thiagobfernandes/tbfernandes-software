"use client";

import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { planningApi } from "@/features/finance/lib/planning-api";
import { formatMonthLong } from "@/features/finance/lib/planning-format";
import type { ExpenseItem } from "@/features/finance/types/planning";
import { dataActions } from "@/lib/sample-data/store";

import { runAction } from "./planning-ui";

/** What a line of the month points to: a commitment, a card month, an installment purchase or an entry. */
export type DeletableLine = Pick<
  ExpenseItem,
  "source" | "sourceId" | "cardId" | "name"
> & {
  /** For card lines: only a month with a statement can lose it. */
  hasStatement: boolean;
};

type Plan = {
  noun: string;
  consequence: string;
  action: () => Promise<unknown>;
  done: string;
};

function planFor(line: DeletableLine, month: string): Plan | null {
  const { source, sourceId, cardId } = line;
  if (source === "commitment") {
    return {
      noun: "compromisso",
      consequence:
        "Ele sai de todos os meses, com os pagamentos registrados. Para parar só daqui para frente, use Encerrar em Compromissos.",
      action: () => planningApi.deleteCommitment(sourceId),
      done: "Compromisso excluído",
    };
  }
  if (source === "purchase" && cardId) {
    return {
      noun: "compra parcelada",
      consequence: "Todas as parcelas saem das faturas do cartão.",
      action: () => planningApi.removePurchase(cardId, sourceId),
      done: "Compra parcelada excluída",
    };
  }
  if (source === "card" && cardId && line.hasStatement) {
    return {
      noun: `fatura de ${formatMonthLong(month).toLowerCase()}`,
      consequence:
        "A fatura do mês e as transações importadas nela são removidas. O cartão continua cadastrado.",
      action: () => planningApi.removeStatement(cardId, month),
      done: "Fatura excluída",
    };
  }
  if (source === "entry") {
    return {
      noun: "lançamento",
      consequence: "O lançamento sai também do Fluxo de caixa.",
      action: async () => dataActions.remove("financeEntries", sourceId),
      done: "Lançamento excluído",
    };
  }
  return null;
}

/**
 * Deletes what a line of the month comes from, after confirming. Card lines made only of the
 * monthly estimate have nothing to delete here: the estimate is edited on the card.
 */
export function LineDelete({
  line,
  month,
  closed,
  onDone,
}: {
  line: DeletableLine;
  month: string;
  closed: boolean;
  onDone: () => Promise<void> | void;
}) {
  const plan = planFor(line, month);
  if (!plan) return <span className="w-7" aria-hidden />;
  return (
    <ConfirmDelete
      noun={plan.noun}
      name={line.name}
      consequence={plan.consequence}
      blockedReason={
        closed ? "O mês está fechado. Reabra o mês para excluir." : undefined
      }
      onConfirm={() => void runAction(plan.action, plan.done, onDone)}
    />
  );
}
