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
  projectSchema,
  type ProjectFormValues,
} from "@/features/projects/schemas/project-schema";
import type { Project, ProjectColor } from "@/features/projects/types/project";
import { projectColorClasses } from "@/lib/project-colors";
import { useWorkData, workActions } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

const NONE = "none";
const colors = Object.keys(projectColorClasses) as ProjectColor[];

type ProjectFormDialogProps = {
  trigger: React.ReactNode;
  project?: Project;
  defaultCompanyId?: string;
};

export function ProjectFormDialog({
  trigger,
  project,
  defaultCompanyId,
}: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { companies, goals } = useWorkData();
  const editing = Boolean(project);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? "",
      companyId: project?.companyId ?? defaultCompanyId ?? NONE,
      goalId: project?.goalId ?? NONE,
      category: project?.category ?? "professional",
      status: project?.status ?? "active",
      color: project?.color ?? "teal",
      startDate: project?.startDate ?? currentDay(),
      dueDate: project?.dueDate ?? "",
      nextDelivery: project?.nextDelivery ?? "",
      description: project?.description ?? "",
    },
  });
  const { errors } = form.formState;

  function onSubmit(values: ProjectFormValues) {
    const data = emptyToUndefined({
      ...values,
      companyId: values.companyId === NONE ? "" : values.companyId,
      goalId: values.goalId === NONE ? "" : values.goalId,
    }) as Omit<Project, "id">;
    if (project) {
      workActions.updateProject(project.id, data);
      toast.success("Projeto atualizado");
    } else {
      const created = workActions.addProject(data);
      toast.success(`Projeto "${created.name}" criado`);
      form.reset();
    }
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && editing) form.reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar projeto" : "Novo projeto"}
          </DialogTitle>
          <DialogDescription>
            Um projeto agrupa tarefas em torno de um resultado concreto.
          </DialogDescription>
        </DialogHeader>
        <form
          id="project-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <FormField
            id="project-name"
            label="Nome"
            required
            error={errors.name?.message}
            className="sm:col-span-2"
          >
            <Input
              id="project-name"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              {...form.register("name")}
            />
          </FormField>
          <FormField id="project-company" label="Empresa">
            <Controller
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="project-company">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Iniciativa pessoal</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField id="project-goal" label="Meta">
            <Controller
              control={form.control}
              name="goalId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="project-goal">
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
          <FormField id="project-category" label="Categoria">
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="project-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="personal">Pessoal</SelectItem>
                    <SelectItem value="study">Estudo</SelectItem>
                    <SelectItem value="research">Pesquisa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField id="project-status" label="Status">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="project-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejado</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField id="project-color" label="Cor">
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <div
                  id="project-color"
                  role="radiogroup"
                  aria-label="Cor do projeto"
                  className="flex h-9 items-center gap-2"
                >
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={field.value === color}
                      aria-label={color}
                      onClick={() => field.onChange(color)}
                      className={cn(
                        "size-6 rounded-full ring-offset-2 ring-offset-card outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        projectColorClasses[color].bg,
                        field.value === color && "ring-2 ring-foreground",
                      )}
                    />
                  ))}
                </div>
              )}
            />
          </FormField>
          <FormField
            id="project-start"
            label="Data de início"
            required
            error={errors.startDate?.message}
          >
            <Input
              id="project-start"
              type="date"
              aria-invalid={Boolean(errors.startDate)}
              {...form.register("startDate")}
            />
          </FormField>
          <FormField
            id="project-due"
            label="Prazo"
            error={errors.dueDate?.message}
          >
            <Input
              id="project-due"
              type="date"
              aria-invalid={Boolean(errors.dueDate)}
              {...form.register("dueDate")}
            />
          </FormField>
          <FormField
            id="project-next"
            label="Próxima entrega"
            hint="ex.: MVP: empresas e tarefas · 15/11"
            className="sm:col-span-2"
          >
            <Input id="project-next" {...form.register("nextDelivery")} />
          </FormField>
          <FormField
            id="project-description"
            label="Descrição"
            className="sm:col-span-2"
          >
            <Textarea
              id="project-description"
              rows={3}
              {...form.register("description")}
            />
          </FormField>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" form="project-form">
            {editing ? "Salvar alterações" : "Criar projeto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
