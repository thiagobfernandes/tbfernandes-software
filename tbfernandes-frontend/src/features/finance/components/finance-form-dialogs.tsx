"use client";

import { toast } from "sonner";

import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import {
  entrySchema,
  purchaseSchema,
} from "@/features/finance/schemas/finance-schema";
import type {
  FinanceEntry,
  PurchaseGoal,
} from "@/features/finance/types/finance";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";

type DialogProps<T> = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  item?: T;
};

export function EntryFormDialog({
  item,
  ...dialog
}: DialogProps<FinanceEntry>) {
  const { financeEntries } = useAppData();
  const categories = [
    ...new Set(financeEntries.map((entry) => entry.category)),
  ].sort();

  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Editar lançamento" : "Novo lançamento"}
      description="Mantenha o dinheiro da empresa separado do pessoal: faturamento da empresa não é renda disponível sua."
      schema={entrySchema}
      submitLabel={item ? "Salvar alterações" : "Adicionar lançamento"}
      defaults={{
        kind: item?.kind ?? "expense",
        scope: item?.scope ?? "personal",
        description: item?.description ?? "",
        category: item?.category ?? "",
        amount: item?.amount as number,
        date: item?.date ?? currentDay(),
        recurring: item?.recurring ?? false,
      }}
      fields={[
        {
          name: "kind",
          label: "Tipo",
          type: "select",
          options: [
            { value: "income", label: "Entrada" },
            { value: "expense", label: "Saída" },
          ],
        },
        {
          name: "scope",
          label: "Escopo",
          type: "select",
          options: [
            { value: "personal", label: "Pessoal" },
            { value: "business", label: "Empresa (PJ)" },
          ],
        },
        {
          name: "description",
          label: "Descrição",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "category",
          label: "Categoria",
          type: "text",
          required: true,
          hint: categories.length
            ? `Em uso: ${categories.join(", ")}`
            : undefined,
        },
        {
          name: "amount",
          label: "Valor (R$)",
          type: "number",
          min: 0,
          step: 0.01,
          required: true,
        },
        { name: "date", label: "Data", type: "date", required: true },
        {
          name: "recurring",
          label: "Recorrente",
          type: "checkbox",
          placeholder: "Repete todo mês",
        },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("financeEntries", item.id, values);
          toast.success("Lançamento atualizado");
        } else {
          dataActions.create("financeEntries", values);
          toast.success("Lançamento adicionado");
        }
      }}
    />
  );
}

export function PurchaseFormDialog({
  item,
  ...dialog
}: DialogProps<PurchaseGoal>) {
  const { goals } = useAppData();
  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Editar compra planejada" : "Nova compra planejada"}
      description="Defina quanto vai guardar por mês para ver quando poderá comprar."
      schema={purchaseSchema}
      submitLabel={item ? "Salvar alterações" : "Adicionar compra"}
      defaults={{
        name: item?.name ?? "",
        description: item?.description ?? "",
        estimated: item?.estimated as number,
        reserved: item?.reserved ?? 0,
        monthlySaving: item?.monthlySaving,
        priority: item?.priority ?? "normal",
        desiredDate: item?.desiredDate ?? "",
        goalId: item?.goalId ?? "",
        status: item?.status ?? "planned",
        paid: item?.paid,
      }}
      fields={[
        {
          name: "name",
          label: "Nome",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "estimated",
          label: "Preço estimado (R$)",
          type: "number",
          min: 0,
          required: true,
        },
        {
          name: "reserved",
          label: "Já reservado (R$)",
          type: "number",
          min: 0,
        },
        {
          name: "monthlySaving",
          label: "Economia mensal (R$)",
          type: "number",
          min: 0,
        },
        { name: "desiredDate", label: "Data desejada", type: "date" },
        {
          name: "priority",
          label: "Prioridade",
          type: "select",
          options: [
            { value: "low", label: "Baixa" },
            { value: "normal", label: "Normal" },
            { value: "high", label: "Alta" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "planned", label: "Planejada" },
            { value: "saving", label: "Guardando" },
            { value: "bought", label: "Comprada" },
          ],
        },
        {
          name: "paid",
          label: "Preço pago (R$)",
          type: "number",
          min: 0,
          hint: "Quando comprada.",
        },
        {
          name: "goalId",
          label: "Meta",
          type: "select",
          optional: true,
          options: goals.map((g) => ({ value: g.id, label: g.name })),
        },
        { name: "description", label: "Notas", type: "textarea", rows: 2 },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("purchases", item.id, values);
          toast.success("Compra atualizada");
        } else {
          dataActions.create("purchases", values);
          toast.success("Compra adicionada");
        }
      }}
    />
  );
}
