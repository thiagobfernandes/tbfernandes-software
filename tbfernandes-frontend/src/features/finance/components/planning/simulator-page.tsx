"use client";

import { useCallback, useEffect, useState } from "react";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planningApi } from "@/features/finance/lib/planning-api";
import {
  errorMessage,
  formatMoney,
  formatMonthShort,
  formatSigned,
} from "@/features/finance/lib/planning-format";
import type {
  Commitment,
  CreditCard,
  ReserveFund,
  ScenarioOperation,
  Simulation,
} from "@/features/finance/types/planning";
import { cn } from "@/lib/utils";

import { ApiOnly, runAction, thisMonth, useApiResource } from "./planning-ui";

const MONTHS = 13;

type FieldKind =
  | "commitment"
  | "purchase"
  | "card"
  | "fund"
  | "month"
  | "money"
  | "text"
  | "count";
type Field = {
  name: string;
  label: string;
  kind: FieldKind;
  filter?: (item: Commitment) => boolean;
};
type Values = Record<string, string>;
type Change = {
  label: string;
  fields: Field[];
  build: (values: Values) => ScenarioOperation;
};

const isSalary = (item: Commitment) => item.category === "salary";
const isLoan = (item: Commitment) => item.category === "loan";
const isExpense = (item: Commitment) => item.direction === "expense";
const money = (value: string) => Number(value.replace(",", "."));

/** Every change the simulator can try; each becomes one API operation. */
const CHANGES: Record<string, Change> = {
  salary: {
    label: "Salário de um mês",
    fields: [
      {
        name: "commitmentId",
        label: "Receita",
        kind: "commitment",
        filter: isSalary,
      },
      { name: "month", label: "Mês", kind: "month" },
      { name: "amount", label: "Valor", kind: "money" },
    ],
    build: (values) => ({
      type: "set_month_amount",
      commitmentId: values.commitmentId,
      month: values.month,
      amount: money(values.amount),
      certainty: "estimated",
    }),
  },
  salaryFrom: {
    label: "Novo salário a partir de",
    fields: [
      {
        name: "commitmentId",
        label: "Receita",
        kind: "commitment",
        filter: isSalary,
      },
      { name: "month", label: "A partir de", kind: "month" },
      { name: "amount", label: "Valor", kind: "money" },
    ],
    build: (values) => ({
      type: "change_from",
      commitmentId: values.commitmentId,
      fromMonth: values.month,
      amount: money(values.amount),
    }),
  },
  freelance: {
    label: "Freelance",
    fields: [
      { name: "name", label: "Descrição", kind: "text" },
      { name: "month", label: "Mês", kind: "month" },
      { name: "amount", label: "Valor", kind: "money" },
    ],
    build: (values) => ({
      type: "add_one_off",
      category: "freelance",
      name: values.name || "Freelance",
      month: values.month,
      amount: money(values.amount),
    }),
  },
  extra: {
    label: "Gasto extra",
    fields: [
      { name: "name", label: "Descrição", kind: "text" },
      { name: "month", label: "Mês", kind: "month" },
      { name: "amount", label: "Valor", kind: "money" },
    ],
    build: (values) => ({
      type: "add_one_off",
      category: "extra",
      name: values.name || "Gasto extra",
      month: values.month,
      amount: money(values.amount),
    }),
  },
  cancel: {
    label: "Cancelar conta ou assinatura",
    fields: [
      {
        name: "commitmentId",
        label: "Conta",
        kind: "commitment",
        filter: isExpense,
      },
      { name: "month", label: "A partir de", kind: "month" },
    ],
    build: (values) => ({
      type: "change_from",
      commitmentId: values.commitmentId,
      fromMonth: values.month,
      active: false,
    }),
  },
  reactivate: {
    label: "Reativar conta ou assinatura",
    fields: [
      {
        name: "commitmentId",
        label: "Conta",
        kind: "commitment",
        filter: isExpense,
      },
      { name: "month", label: "A partir de", kind: "month" },
    ],
    build: (values) => ({
      type: "change_from",
      commitmentId: values.commitmentId,
      fromMonth: values.month,
      active: true,
    }),
  },
  renegotiate: {
    label: "Renegociar dívida (novo valor)",
    fields: [
      {
        name: "commitmentId",
        label: "Dívida",
        kind: "commitment",
        filter: isLoan,
      },
      { name: "month", label: "A partir de", kind: "month" },
      { name: "amount", label: "Nova parcela", kind: "money" },
    ],
    build: (values) => ({
      type: "change_from",
      commitmentId: values.commitmentId,
      fromMonth: values.month,
      amount: money(values.amount),
    }),
  },
  prepay: {
    label: "Adiantar dívida",
    fields: [
      {
        name: "commitmentId",
        label: "Dívida",
        kind: "commitment",
        filter: isLoan,
      },
      { name: "month", label: "Mês", kind: "month" },
      { name: "amount", label: "Valor a mais", kind: "money" },
    ],
    build: (values) => ({
      type: "prepay_debt",
      commitmentId: values.commitmentId,
      month: values.month,
      amount: money(values.amount),
    }),
  },
  purchase: {
    label: "Mudar compra parcelada (viagem)",
    fields: [
      { name: "purchase", label: "Compra", kind: "purchase" },
      { name: "total", label: "Valor total", kind: "money" },
      { name: "installments", label: "Parcelas", kind: "count" },
      { name: "month", label: "Primeira fatura", kind: "month" },
    ],
    build: (values) => {
      const [cardId, purchaseId] = values.purchase.split("|");
      return {
        type: "change_purchase",
        cardId,
        purchaseId,
        ...(values.total && { total: money(values.total) }),
        ...(values.installments && {
          installments: Number(values.installments),
        }),
        ...(values.month && { firstMonth: values.month }),
      };
    },
  },
  newPurchase: {
    label: "Nova compra parcelada",
    fields: [
      { name: "cardId", label: "Cartão", kind: "card" },
      { name: "name", label: "Descrição", kind: "text" },
      { name: "total", label: "Valor total", kind: "money" },
      { name: "installments", label: "Parcelas", kind: "count" },
      { name: "month", label: "Primeira fatura", kind: "month" },
    ],
    build: (values) => ({
      type: "add_purchase",
      cardId: values.cardId,
      description: values.name || "Compra parcelada",
      total: money(values.total),
      installments: Number(values.installments || 1),
      firstMonth: values.month,
      withInterest: false,
    }),
  },
  deposit: {
    label: "Guardar na reserva",
    fields: [
      { name: "fundId", label: "Reserva", kind: "fund" },
      { name: "month", label: "Mês", kind: "month" },
      { name: "amount", label: "Valor", kind: "money" },
    ],
    build: (values) => ({
      type: "reserve_deposit",
      fundId: values.fundId,
      month: values.month,
      amount: money(values.amount),
    }),
  },
  contribution: {
    label: "Contribuição de outra pessoa",
    fields: [
      { name: "fundId", label: "Reserva", kind: "fund" },
      { name: "amount", label: "Valor prometido", kind: "money" },
    ],
    build: (values) => ({
      type: "set_contribution",
      fundId: values.fundId,
      amount: money(values.amount),
    }),
  },
};

type Planned = { label: string; operation: ScenarioOperation };

export function SimulatorPage() {
  return (
    <ApiOnly title="Simulador">
      <Simulator />
    </ApiOnly>
  );
}

function Simulator() {
  const loadCommitments = useCallback(() => planningApi.commitments(), []);
  const loadCards = useCallback(() => planningApi.cards(), []);
  const loadFunds = useCallback(() => planningApi.funds(), []);
  const commitments = useApiResource(loadCommitments);
  const cards = useApiResource(loadCards);
  const funds = useApiResource(loadFunds);
  const [planned, setPlanned] = useState<Planned[]>([]);
  const [simulation, setSimulation] = useState<Simulation>();
  const from = thisMonth();

  useEffect(() => {
    let cancelled = false;
    planningApi
      .simulate(
        from,
        MONTHS,
        planned.map((item) => item.operation),
      )
      .then((result) => !cancelled && setSimulation(result))
      .catch((error: unknown) => {
        toast.error(errorMessage(error));
        if (!cancelled) setPlanned((items) => items.slice(0, -1));
      });
    return () => {
      cancelled = true;
    };
  }, [from, planned]);

  async function confirm() {
    const ok = await runAction(
      () => planningApi.applyScenario(planned.map((item) => item.operation)),
      "Mudanças salvas no planejamento",
    );
    if (ok) {
      setPlanned([]);
      await Promise.all([commitments.reload(), cards.reload(), funds.reload()]);
    }
  }

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Simulador"
        description="Teste mudanças sem tocar no planejamento. Nada é salvo até você confirmar."
        actions={
          <Button disabled={planned.length === 0} onClick={confirm}>
            Confirmar {planned.length || ""} mudança
            {planned.length === 1 ? "" : "s"}
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <ChangeForm
            commitments={commitments.data ?? []}
            cards={cards.data ?? []}
            funds={funds.data ?? []}
            onAdd={(item) => setPlanned((items) => [...items, item])}
          />
          <Card className="gap-3 rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Mudanças em teste</CardTitle>
            </CardHeader>
            <CardContent>
              {planned.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma ainda. O lado direito mostra o plano atual.
                </p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {planned.map((item, index) => (
                    <li
                      key={`${item.label}-${index}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>{item.label}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remover ${item.label}`}
                        onClick={() =>
                          setPlanned((items) =>
                            items.filter((_, position) => position !== index),
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <Comparison simulation={simulation} className="xl:col-span-3" />
      </div>
    </PageContainer>
  );
}

function ChangeForm({
  commitments,
  cards,
  funds,
  onAdd,
}: {
  commitments: Commitment[];
  cards: CreditCard[];
  funds: ReserveFund[];
  onAdd: (item: Planned) => void;
}) {
  const [kind, setKind] = useState("salaryFrom");
  const [values, setValues] = useState<Values>({ month: thisMonth() });
  const change = CHANGES[kind];
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const options = (field: Field): { value: string; label: string }[] => {
    if (field.kind === "commitment") {
      return commitments
        .filter(field.filter ?? (() => true))
        .map((item) => ({ value: item.id, label: item.name }));
    }
    if (field.kind === "card")
      return cards.map((card) => ({ value: card.id, label: card.name }));
    if (field.kind === "fund")
      return funds.map((fund) => ({ value: fund.id, label: fund.name }));
    return cards.flatMap((card) =>
      card.purchases.map((purchase) => ({
        value: `${card.id}|${purchase.id}`,
        label: `${purchase.description} (${card.name})`,
      })),
    );
  };

  function add() {
    const missing = change.fields.find(
      (field) =>
        !values[field.name] &&
        !["text", "count"].includes(field.kind) &&
        change !== CHANGES.purchase,
    );
    if (missing) {
      toast.error(`Preencha ${missing.label.toLowerCase()}`);
      return;
    }
    const detail = change.fields
      .map((field) => describe(field, values[field.name], options))
      .filter(Boolean)
      .join(" · ");
    onAdd({
      label: `${change.label}: ${detail}`,
      operation: change.build(values),
    });
  }

  return (
    <Card className="gap-3 rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="size-4 text-primary" aria-hidden /> Nova
          mudança
        </CardTitle>
        <CardDescription>
          Escolha o que testar e preencha os campos.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>O que mudar</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHANGES).map(([key, item]) => (
                <SelectItem key={key} value={key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {change.fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <Label htmlFor={`sim-${field.name}`}>{field.label}</Label>
            {["commitment", "card", "fund", "purchase"].includes(field.kind) ? (
              <Select
                value={values[field.name] ?? ""}
                onValueChange={(value) => set(field.name, value)}
              >
                <SelectTrigger id={`sim-${field.name}`} className="w-full">
                  <SelectValue placeholder="Escolha" />
                </SelectTrigger>
                <SelectContent>
                  {options(field).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`sim-${field.name}`}
                type={
                  field.kind === "month"
                    ? "month"
                    : field.kind === "text"
                      ? "text"
                      : "number"
                }
                step={field.kind === "money" ? 0.01 : 1}
                value={values[field.name] ?? ""}
                onChange={(event) => set(field.name, event.target.value)}
              />
            )}
          </div>
        ))}
        <Button className="sm:col-span-2" variant="outline" onClick={add}>
          <Plus /> Testar esta mudança
        </Button>
      </CardContent>
    </Card>
  );
}

function describe(
  field: Field,
  value: string | undefined,
  options: (field: Field) => { value: string; label: string }[],
) {
  if (!value) return null;
  if (field.kind === "money") return formatMoney(money(value));
  if (field.kind === "month") return formatMonthShort(value);
  if (field.kind === "count") return `${value}x`;
  if (field.kind === "text") return value;
  return options(field).find((option) => option.value === value)?.label ?? null;
}

function Comparison({
  simulation,
  className,
}: {
  simulation: Simulation | undefined;
  className?: string;
}) {
  return (
    <Card className={cn("gap-3 rounded-lg", className)}>
      <CardHeader>
        <CardTitle className="text-base">Plano atual × simulado</CardTitle>
        <CardDescription>
          Receitas, despesas e sobra de cada mês, com a diferença.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        {!simulation ? (
          <p className="px-6 text-sm text-muted-foreground">Calculando…</p>
        ) : (
          <table className="w-full min-w-[34rem] text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-6 py-2 text-left font-medium">Mês</th>
                <th className="px-2 py-2 text-right font-medium">Receitas</th>
                <th className="px-2 py-2 text-right font-medium">Despesas</th>
                <th className="px-2 py-2 text-right font-medium">
                  Sobra atual
                </th>
                <th className="px-2 py-2 text-right font-medium">
                  Sobra simulada
                </th>
                <th className="px-6 py-2 text-right font-medium">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {simulation.simulated.map((month, index) => {
                const base = simulation.base[index];
                const difference = month.balance - base.balance;
                return (
                  <tr key={month.month} className="border-b border-border/50">
                    <td className="px-6 py-1.5">
                      {formatMonthShort(month.month)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatMoney(month.income.total)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatMoney(month.expenses.total)}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-1.5 text-right tabular-nums",
                        base.balance < 0 && "text-destructive",
                      )}
                    >
                      {formatMoney(base.balance)}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-1.5 text-right font-medium tabular-nums",
                        month.balance < 0 && "text-destructive",
                      )}
                    >
                      {formatMoney(month.balance)}
                    </td>
                    <td
                      className={cn(
                        "px-6 py-1.5 text-right tabular-nums",
                        difference > 0 && "text-success",
                        difference < 0 && "text-destructive",
                      )}
                    >
                      {difference === 0 ? "—" : formatSigned(difference)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
