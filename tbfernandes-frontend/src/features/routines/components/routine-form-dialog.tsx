"use client";

import { toast } from "sonner";

import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import { routineActions } from "@/features/routines/lib/routine-actions";
import {
  EVERY_DAY,
  shortTime,
  weekdayLabels,
} from "@/features/routines/lib/routines";
import { routineSchema } from "@/features/routines/schemas/routine-schema";
import type { Routine } from "@/features/routines/types/routine";
import { useAppData } from "@/lib/sample-data/store";

type RoutineFormDialogProps = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  item?: Routine;
  today: string;
};

export function RoutineFormDialog({
  item,
  today,
  ...dialog
}: RoutineFormDialogProps) {
  const { projects, tasks, goals } = useAppData();
  const taskOptions = tasks
    .filter(
      (task) =>
        !["done", "canceled"].includes(task.status) || task.id === item?.taskId,
    )
    .map((task) => ({ value: task.id, label: task.title }));

  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Editar rotina" : "Nova rotina"}
      description="Algo que você faz todo dia (ou em dias escolhidos). Cada dia feito é marcado; o tempo gasto vira apontamento."
      schema={routineSchema}
      submitLabel={item ? "Salvar alterações" : "Criar rotina"}
      defaults={{
        title: item?.title ?? "",
        description: item?.description ?? "",
        weekdays: (item?.weekdays ?? EVERY_DAY).map(String),
        startTime: shortTime(item?.startTime) ?? "",
        targetMinutes: item?.targetMinutes,
        startDate: item?.startDate ?? today,
        projectId: item?.projectId ?? "",
        taskId: item?.taskId ?? "",
        goalId: item?.goalId ?? "",
        active: item?.active ?? true,
      }}
      fields={[
        {
          name: "title",
          label: "Rotina",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "weekdays",
          label: "Dias da semana",
          type: "multi",
          full: true,
          options: EVERY_DAY.map((day) => ({
            value: String(day),
            label: weekdayLabels[day],
          })),
        },
        {
          name: "startTime",
          label: "Horário",
          type: "time",
          hint: "Opcional: ordena a lista do dia.",
        },
        {
          name: "targetMinutes",
          label: "Meta de tempo (min)",
          type: "number",
          min: 1,
          hint: "Opcional: comparada ao tempo apontado.",
        },
        { name: "startDate", label: "Começa em", type: "date", required: true },
        {
          name: "goalId",
          label: "Meta",
          type: "select",
          optional: true,
          hint: "Para hábitos: a rotina aparece na meta com a sequência de dias.",
          options: goals
            .filter(
              (goal) => goal.status !== "completed" || goal.id === item?.goalId,
            )
            .map((goal) => ({ value: goal.id, label: goal.name })),
        },
        {
          name: "projectId",
          label: "Projeto",
          type: "select",
          optional: true,
          options: projects.map((project) => ({
            value: project.id,
            label: project.name,
          })),
        },
        {
          name: "taskId",
          label: "Tarefa que ela avança",
          type: "select",
          optional: true,
          full: true,
          hint: "Marcar a rotina não conclui a tarefa; o tempo apontado vai para ela.",
          options: taskOptions,
        },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          rows: 2,
          full: true,
        },
        { name: "active", label: "Ativa", type: "checkbox", full: true },
      ]}
      onSubmit={(values) => {
        const task = tasks.find((candidate) => candidate.id === values.taskId);
        routineActions.save(
          {
            title: values.title,
            description: values.description,
            weekdays: values.weekdays
              .map(Number)
              .sort((first, second) => first - second),
            startTime: values.startTime,
            targetMinutes: values.targetMinutes,
            startDate: values.startDate,
            projectId: task?.projectId ?? values.projectId,
            taskId: values.taskId,
            goalId: values.goalId,
            active: values.active,
          },
          item?.id,
        );
        toast.success(item ? "Rotina atualizada" : "Rotina criada");
        dialog.onOpenChange?.(false);
      }}
    />
  );
}
