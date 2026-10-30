"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { emptyToUndefined, FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  taskSchema,
  type TaskFormValues,
} from "@/features/tasks/schemas/task-schema";
import {
  taskStatusLabels,
  type Task,
  type TaskStatus,
} from "@/features/tasks/types/task";
import { projectColorClasses } from "@/lib/project-colors";
import { useWorkData, workActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

const NONE = "none";

type TaskFormDialogProps = {
  /** Omit when the dialog is opened from outside with `open`. */
  trigger?: React.ReactNode;
  task?: Task;
  defaultProjectId?: string;
  defaultGoalId?: string;
  defaultStatus?: TaskStatus;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function TaskFormDialog({
  trigger,
  task,
  defaultProjectId,
  defaultGoalId,
  defaultStatus = "todo",
  open: controlledOpen,
  onOpenChange,
}: TaskFormDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const { projects, goals } = useWorkData();
  const editing = Boolean(task);

  const defaults: TaskFormValues = {
    title: task?.title ?? "",
    description: task?.description ?? "",
    doneCriteria: task?.doneCriteria ?? "",
    projectId: task?.projectId ?? defaultProjectId ?? NONE,
    goalId: task?.goalId ?? defaultGoalId ?? NONE,
    status: task?.status ?? defaultStatus,
    priority: task?.priority ?? "normal",
    tag: task?.tag ?? "",
    startDate: task?.startDate ?? "",
    dueDate: task?.dueDate ?? "",
  };
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    values: open ? defaults : undefined,
  });
  const { errors } = form.formState;

  function onSubmit(values: TaskFormValues) {
    const data = emptyToUndefined({
      ...values,
      projectId: values.projectId === NONE ? "" : values.projectId,
      goalId: values.goalId === NONE ? "" : values.goalId,
    }) as Omit<Task, "id">;
    if (task) {
      workActions.updateTask(task.id, data);
      toast.success("Tarefa atualizada");
    } else {
      const created = workActions.addTask(data);
      toast.success(`Tarefa "${created.title}" criada`);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            Descreva o resultado esperado, não só a intenção.
          </DialogDescription>
        </DialogHeader>
        <form
          id="task-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <FormField
            id="task-title"
            label="Título"
            required
            error={errors.title?.message}
            className="sm:col-span-2"
          >
            <Input
              id="task-title"
              autoFocus
              placeholder="Configurar um cluster local com vários nós e documentar a configuração"
              aria-invalid={Boolean(errors.title)}
              {...form.register("title")}
            />
          </FormField>
          <FormField
            id="task-description"
            label="Descrição"
            className="sm:col-span-2"
          >
            <Textarea
              id="task-description"
              rows={3}
              {...form.register("description")}
            />
          </FormField>
          <FormField
            id="task-done-criteria"
            label="Critério de pronto"
            hint="Como você vai saber que terminou?"
            className="sm:col-span-2"
          >
            <Input id="task-done-criteria" {...form.register("doneCriteria")} />
          </FormField>
          <FormField
            id="task-project"
            label="Projeto"
            hint="A empresa vem do projeto."
          >
            <Controller
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem projeto</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 rounded-full",
                            projectColorClasses[project.color].bg,
                          )}
                        />
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField id="task-goal" label="Meta">
            <Controller
              control={form.control}
              name="goalId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-goal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem meta</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField
            id="task-tag"
            label="Tag"
            hint="ex.: Backend, Design, Admin"
          >
            <Input id="task-tag" {...form.register("tag")} />
          </FormField>
          <FormField id="task-status" label="Status">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField id="task-priority" label="Prioridade">
            <Controller
              control={form.control}
              name="priority"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField id="task-start" label="Data de início">
            <Input
              id="task-start"
              type="date"
              {...form.register("startDate")}
            />
          </FormField>
          <FormField
            id="task-due"
            label="Prazo"
            error={errors.dueDate?.message}
          >
            <Input
              id="task-due"
              type="date"
              aria-invalid={Boolean(errors.dueDate)}
              {...form.register("dueDate")}
            />
          </FormField>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" form="task-form">
            {editing ? "Salvar alterações" : "Criar tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
