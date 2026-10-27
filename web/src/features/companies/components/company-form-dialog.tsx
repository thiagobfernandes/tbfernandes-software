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
  companySchema,
  type CompanyFormValues,
} from "@/features/companies/schemas/company-schema";
import type { Company } from "@/features/projects/types/project";
import { workActions } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";

type CompanyFormDialogProps = {
  trigger: React.ReactNode;
  /** Edit this company instead of creating a new one. */
  company?: Company;
};

export function CompanyFormDialog({
  trigger,
  company,
}: CompanyFormDialogProps) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(company);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? "",
      tradeName: company?.tradeName ?? "",
      relationship: company?.relationship ?? "client",
      status: company?.status ?? "active",
      startDate: company?.startDate ?? currentDay(),
      mainContact: company?.mainContact ?? "",
      description: company?.description ?? "",
    },
  });
  const { errors } = form.formState;

  function onSubmit(values: CompanyFormValues) {
    const data = emptyToUndefined(values) as Omit<Company, "id">;
    if (company) {
      workActions.updateCompany(company.id, data);
      toast.success("Empresa atualizada");
    } else {
      const created = workActions.addCompany(data);
      toast.success(`Empresa "${created.name}" criada`);
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
            {editing ? "Editar empresa" : "Nova empresa"}
          </DialogTitle>
          <DialogDescription>
            Empresas dão contexto a projetos e tarefas.
          </DialogDescription>
        </DialogHeader>
        <form
          id="company-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <FormField
            id="company-name"
            label="Nome"
            required
            error={errors.name?.message}
          >
            <Input
              id="company-name"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              {...form.register("name")}
            />
          </FormField>
          <FormField id="company-trade-name" label="Nome fantasia">
            <Input id="company-trade-name" {...form.register("tradeName")} />
          </FormField>
          <FormField id="company-relationship" label="Relação">
            <Controller
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="company-relationship">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractor">
                      Contratante (trabalho para ela)
                    </SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="partner">Parceira</SelectItem>
                    <SelectItem value="own">Minha empresa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField id="company-status" label="Status">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="company-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                    <SelectItem value="closed">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField
            id="company-start"
            label="Relação desde"
            required
            error={errors.startDate?.message}
          >
            <Input
              id="company-start"
              type="date"
              aria-invalid={Boolean(errors.startDate)}
              {...form.register("startDate")}
            />
          </FormField>
          <FormField id="company-contact" label="Contato principal">
            <Input id="company-contact" {...form.register("mainContact")} />
          </FormField>
          <FormField
            id="company-description"
            label="Descrição"
            className="sm:col-span-2"
          >
            <Textarea
              id="company-description"
              rows={3}
              {...form.register("description")}
            />
          </FormField>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" form="company-form">
            {editing ? "Salvar alterações" : "Criar empresa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
