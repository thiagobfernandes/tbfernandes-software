"use client";

import { toast } from "sonner";

import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import { goalSchema } from "@/features/goals/schemas/goal-schema";
import { goalAreaLabels, type Goal } from "@/features/goals/types/goal";
import { dataActions, useAppData } from "@/lib/sample-data/store";

type GoalFormDialogProps = {
  trigger: React.ReactNode;
  goal?: Goal;
  defaultParentId?: string;
};

export function GoalFormDialog({
  trigger,
  goal,
  defaultParentId,
}: GoalFormDialogProps) {
  const { goals } = useAppData();
  const parents = goals.filter((item) => item.id !== goal?.id);

  return (
    <EntityFormDialog
      trigger={trigger}
      className="sm:max-w-2xl"
      title={goal ? "Editar meta" : "Nova meta"}
      description="Uma meta se desdobra em marcos, projetos e tarefas que você acompanha."
      schema={goalSchema}
      submitLabel={goal ? "Salvar alterações" : "Criar meta"}
      defaults={{
        name: goal?.name ?? "",
        area: goal?.area ?? "career",
        status: goal?.status ?? "active",
        priority: goal?.priority ?? "normal",
        dueDate: goal?.dueDate ?? "",
        parentId: goal?.parentId ?? defaultParentId ?? "",
        description: goal?.description ?? "",
        currentState: goal?.currentState ?? "",
        desiredResult: goal?.desiredResult ?? "",
        doneCriteria: goal?.doneCriteria ?? "",
        indicatorLabel: goal?.indicator?.label ?? "",
        indicatorCurrent: goal?.indicator?.current,
        indicatorTarget: goal?.indicator?.target,
        indicatorUnit: goal?.indicator?.unit ?? "",
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
          name: "area",
          label: "Área",
          type: "select",
          options: Object.entries(goalAreaLabels).map(([value, label]) => ({
            value,
            label,
          })),
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "planned", label: "Planejada" },
            { value: "active", label: "Ativa" },
            { value: "paused", label: "Pausada" },
            { value: "completed", label: "Concluída" },
          ],
        },
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
        { name: "dueDate", label: "Prazo", type: "date" },
        {
          name: "parentId",
          label: "Parte da meta",
          type: "select",
          optional: true,
          options: parents.map((item) => ({
            value: item.id,
            label: item.name,
          })),
          full: true,
        },
        {
          name: "currentState",
          label: "Onde estou agora",
          type: "textarea",
          rows: 2,
        },
        {
          name: "desiredResult",
          label: "Resultado desejado",
          type: "textarea",
          rows: 2,
          required: true,
        },
        {
          name: "doneCriteria",
          label: "Como sei que terminei",
          type: "textarea",
          rows: 2,
        },
        {
          name: "indicatorLabel",
          label: "Indicador",
          type: "text",
          placeholder: "ex.: Horas de estudo",
          hint: "Número mensurável opcional.",
        },
        {
          name: "indicatorUnit",
          label: "Unidade",
          type: "text",
          placeholder: "h, BRL, funcionalidades",
        },
        {
          name: "indicatorCurrent",
          label: "Valor atual",
          type: "number",
          min: 0,
        },
        {
          name: "indicatorTarget",
          label: "Valor alvo",
          type: "number",
          min: 0,
        },
      ]}
      onSubmit={({
        indicatorLabel,
        indicatorCurrent,
        indicatorTarget,
        indicatorUnit,
        ...values
      }) => {
        const data = {
          ...values,
          indicator:
            indicatorLabel && indicatorTarget
              ? {
                  label: indicatorLabel,
                  current: indicatorCurrent ?? 0,
                  target: indicatorTarget,
                  unit: indicatorUnit ?? "",
                }
              : undefined,
        } as Omit<Goal, "id">;
        if (goal) {
          dataActions.update("goals", goal.id, data);
          toast.success("Meta atualizada");
        } else {
          const created = dataActions.create("goals", data);
          toast.success(`Meta "${created.name}" criada`);
        }
      }}
    />
  );
}
