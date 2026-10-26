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
      title={item ? "Edit entry" : "New entry"}
      description="Keep business and personal money apart: company revenue is not your disposable income."
      schema={entrySchema}
      submitLabel={item ? "Save changes" : "Add entry"}
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
          label: "Type",
          type: "select",
          options: [
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" },
          ],
        },
        {
          name: "scope",
          label: "Scope",
          type: "select",
          options: [
            { value: "personal", label: "Personal" },
            { value: "business", label: "Business (PJ)" },
          ],
        },
        {
          name: "description",
          label: "Description",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "category",
          label: "Category",
          type: "text",
          required: true,
          hint: categories.length
            ? `In use: ${categories.join(", ")}`
            : undefined,
        },
        {
          name: "amount",
          label: "Amount (BRL)",
          type: "number",
          min: 0,
          step: 0.01,
          required: true,
        },
        { name: "date", label: "Date", type: "date", required: true },
        {
          name: "recurring",
          label: "Recurring",
          type: "checkbox",
          placeholder: "Repeats every month",
        },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("financeEntries", item.id, values);
          toast.success("Entry updated");
        } else {
          dataActions.create("financeEntries", values);
          toast.success("Entry added");
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
      title={item ? "Edit planned purchase" : "New planned purchase"}
      description="Set a monthly saving to see when you can afford it."
      schema={purchaseSchema}
      submitLabel={item ? "Save changes" : "Add purchase"}
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
          label: "Name",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "estimated",
          label: "Estimated price (BRL)",
          type: "number",
          min: 0,
          required: true,
        },
        {
          name: "reserved",
          label: "Already reserved (BRL)",
          type: "number",
          min: 0,
        },
        {
          name: "monthlySaving",
          label: "Monthly saving (BRL)",
          type: "number",
          min: 0,
        },
        { name: "desiredDate", label: "Desired date", type: "date" },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: [
            { value: "low", label: "Low" },
            { value: "normal", label: "Normal" },
            { value: "high", label: "High" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "planned", label: "Planned" },
            { value: "saving", label: "Saving" },
            { value: "bought", label: "Bought" },
          ],
        },
        {
          name: "paid",
          label: "Price paid (BRL)",
          type: "number",
          min: 0,
          hint: "When bought.",
        },
        {
          name: "goalId",
          label: "Goal",
          type: "select",
          optional: true,
          options: goals.map((g) => ({ value: g.id, label: g.name })),
        },
        { name: "description", label: "Notes", type: "textarea", rows: 2 },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("purchases", item.id, values);
          toast.success("Purchase updated");
        } else {
          dataActions.create("purchases", values);
          toast.success("Purchase added");
        }
      }}
    />
  );
}
