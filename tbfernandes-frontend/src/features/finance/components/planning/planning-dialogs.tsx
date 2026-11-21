"use client";

import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import { planningApi } from "@/features/finance/lib/planning-api";
import { formatMoney } from "@/features/finance/lib/planning-format";
import {
  parseScenarios,
  paymentSchema,
  settingsSchema,
} from "@/features/finance/schemas/planning-schema";
import type {
  PlanningSettings,
  ProjectionLine,
} from "@/features/finance/types/planning";
import { currentDay } from "@/lib/today";

import { runAction } from "./planning-ui";

/** Marks a bill paid (or income received): the obligation stays in the history. */
export function PaymentDialog({
  line,
  month,
  onDone,
  onOpenChange,
}: {
  line: ProjectionLine | undefined;
  month: string;
  onDone: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
}) {
  const income = line?.direction === "income";
  return (
    <EntityFormDialog
      open={Boolean(line)}
      onOpenChange={onOpenChange}
      title={income ? "Registrar recebimento" : "Registrar pagamento"}
      description={
        line
          ? `${line.name}: previsto ${formatMoney(line.planned)}. O valor real entra no saldo e o previsto fica no histórico.`
          : undefined
      }
      schema={paymentSchema}
      submitLabel={income ? "Recebi" : "Paguei"}
      defaults={{ amount: line?.amount ?? 0, paidOn: currentDay() }}
      fields={[
        {
          name: "amount",
          label: "Valor",
          type: "number",
          step: 0.01,
          required: true,
        },
        { name: "paidOn", label: "Data", type: "date", required: true },
      ]}
      onSubmit={async (values) => {
        if (!line) return;
        const pay =
          line.source === "card"
            ? planningApi.payStatement(line.sourceId, month, values)
            : planningApi.pay(line.sourceId, month, values);
        const ok = await runAction(
          () => pay,
          income ? "Recebimento registrado" : "Pagamento registrado",
          onDone,
        );
        if (ok) onOpenChange(false);
      }}
    />
  );
}

export async function undoPayment(
  line: ProjectionLine,
  month: string,
  onDone: () => Promise<void> | void,
) {
  await runAction(
    () =>
      line.source === "card"
        ? planningApi.unpayStatement(line.sourceId, month)
        : planningApi.unpay(line.sourceId, month),
    "Pagamento desfeito",
    onDone,
  );
}

/** Safety margin, checking account balance and the salary bands to compare. */
export function SettingsDialog({
  settings,
  trigger,
  onDone,
}: {
  settings: PlanningSettings | undefined;
  trigger: React.ReactNode;
  onDone: () => Promise<void> | void;
}) {
  return (
    <EntityFormDialog
      trigger={trigger}
      title="Configurar planejamento"
      description="O saldo da conta é o dinheiro no banco, não a reserva. As faixas de salário só servem de comparação: nunca viram receita."
      schema={settingsSchema}
      submitLabel="Salvar"
      defaults={{
        safetyMargin: settings?.safetyMargin ?? 0,
        accountBalance: settings?.accountBalance ?? undefined,
        accountBalanceOn: settings?.accountBalanceOn ?? "",
        scenarios: (settings?.salaryScenarios ?? [])
          .map((scenario) => `${scenario.label}: ${scenario.amount}`)
          .join("\n"),
      }}
      fields={[
        {
          name: "safetyMargin",
          label: "Quanto quero que sobre por mês",
          type: "number",
          step: 0.01,
          hint: "Ex.: 1000. A tela mostra quanto ainda dá para gastar mantendo esse valor.",
        },
        {
          name: "accountBalance",
          label: "Saldo da conta",
          type: "number",
          step: 0.01,
        },
        { name: "accountBalanceOn", label: "Saldo em", type: "date" },
        {
          name: "scenarios",
          label: "Faixas de salário",
          type: "textarea",
          rows: 5,
          full: true,
          placeholder: "Conservador: 3000\nAtual: 3300\nAumento 1: 3600",
          hint: "Uma por linha, no formato Rótulo: valor.",
        },
      ]}
      onSubmit={(values) =>
        runAction(
          () =>
            planningApi.updateSettings({
              safetyMargin: values.safetyMargin ?? 0,
              accountBalance: values.accountBalance ?? null,
              accountBalanceOn: values.accountBalanceOn || null,
              salaryScenarios: parseScenarios(values.scenarios ?? ""),
            }),
          "Planejamento atualizado",
          onDone,
        )
      }
    />
  );
}
