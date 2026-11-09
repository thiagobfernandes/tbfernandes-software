"use client";

import { toast } from "sonner";

import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import {
  fromLocal,
  localDay,
  localTime,
} from "@/features/time-tracking/lib/time";
import { timeActions } from "@/features/time-tracking/lib/time-actions";
import {
  finishedEntrySchema,
  runningEntrySchema,
} from "@/features/time-tracking/schemas/time-entry-schema";
import type { TimeEntry } from "@/features/time-tracking/types/time-entry";
import { useAppData } from "@/lib/sample-data/store";

type TimeEntryFormDialogProps = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  item?: TimeEntry;
  day: string;
};

export function TimeEntryFormDialog({
  item,
  day,
  ...dialog
}: TimeEntryFormDialogProps) {
  const { projects, tasks } = useAppData();
  const running = Boolean(item && !item.endedAt);
  const start = item ? new Date(item.startedAt) : undefined;
  const end = item?.endedAt ? new Date(item.endedAt) : undefined;

  return (
    <EntityFormDialog
      {...dialog}
      title={item ? "Editar apontamento" : "Lançar apontamento"}
      description={
        running
          ? "Este apontamento está em andamento. Deixe o fim vazio para ele continuar contando."
          : "Registre um período que você esqueceu de apontar na hora."
      }
      schema={running ? runningEntrySchema : finishedEntrySchema}
      submitLabel={item ? "Salvar alterações" : "Lançar"}
      defaults={{
        description: item?.description ?? "",
        date: start ? localDay(start) : day,
        startTime: start ? localTime(start) : "",
        endTime: end ? localTime(end) : "",
        projectId: item?.projectId ?? "",
        taskId: item?.taskId ?? "",
        note: item?.note ?? "",
      }}
      fields={[
        {
          name: "description",
          label: "O que você fez",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "date",
          label: "Data",
          type: "date",
          required: true,
          full: true,
        },
        { name: "startTime", label: "Início", type: "time", required: true },
        {
          name: "endTime",
          label: "Fim",
          type: "time",
          required: !running,
          hint: running ? "Vazio: continua em andamento." : undefined,
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
          label: "Tarefa",
          type: "select",
          optional: true,
          options: tasks.map((task) => ({ value: task.id, label: task.title })),
        },
        { name: "note", label: "Nota", type: "textarea", rows: 2, full: true },
      ]}
      onSubmit={(values) => {
        const task = tasks.find((candidate) => candidate.id === values.taskId);
        timeActions.save(
          {
            description: values.description,
            projectId: task?.projectId ?? values.projectId,
            taskId: values.taskId,
            startedAt: fromLocal(values.date, values.startTime).toISOString(),
            endedAt: values.endTime
              ? fromLocal(values.date, values.endTime).toISOString()
              : undefined,
            note: values.note,
          },
          item?.id,
        );
        toast.success(item ? "Apontamento atualizado" : "Apontamento lançado");
        dialog.onOpenChange?.(false);
      }}
    />
  );
}
