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
      toast.success("Company updated");
    } else {
      const created = workActions.addCompany(data);
      toast.success(`Company "${created.name}" created`);
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
          <DialogTitle>{editing ? "Edit company" : "New company"}</DialogTitle>
          <DialogDescription>
            Organizations give context to projects and tasks.
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
            label="Name"
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
          <FormField id="company-trade-name" label="Trade name">
            <Input id="company-trade-name" {...form.register("tradeName")} />
          </FormField>
          <FormField id="company-relationship" label="Relationship">
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
                      Contractor (I work for them)
                    </SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="own">My company</SelectItem>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField
            id="company-start"
            label="Relationship since"
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
          <FormField id="company-contact" label="Main contact">
            <Input id="company-contact" {...form.register("mainContact")} />
          </FormField>
          <FormField
            id="company-description"
            label="Description"
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
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="company-form">
            {editing ? "Save changes" : "Create company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
