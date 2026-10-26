"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { TagInput } from "@/components/shared/tag-input";
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
import { methodCategoryMeta } from "@/features/methods/components/method-category";
import {
  methodSchema,
  type MethodFormValues,
} from "@/features/methods/schemas/method-schema";
import type { Method, MethodCategory } from "@/features/methods/types/method";
import { dataActions } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";

type MethodFormDialogProps = {
  trigger: React.ReactNode;
  method?: Method;
  onSaved?: (method: Method) => void;
};

export function MethodFormDialog({
  trigger,
  method,
  onSaved,
}: MethodFormDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        {/* Mounted only while open: field arrays generate ids on render. */}
        <MethodForm
          method={method}
          onSaved={onSaved}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function MethodForm({
  method,
  onSaved,
  onDone,
}: Omit<MethodFormDialogProps, "trigger"> & { onDone: () => void }) {
  const defaults: MethodFormValues = {
    title: method?.title ?? "",
    summary: method?.summary ?? "",
    category: method?.category ?? "development",
    tags: method?.tags ?? [],
    steps: method?.steps.map((step) => ({
      title: step.title,
      detail: step.detail ?? "",
    })) ?? [{ title: "", detail: "" }],
    examples: method?.examples ?? [],
  };
  const form = useForm<MethodFormValues>({
    resolver: zodResolver(methodSchema),
    defaultValues: defaults,
  });
  const steps = useFieldArray({ control: form.control, name: "steps" });
  const examples = useFieldArray({ control: form.control, name: "examples" });
  const { errors } = form.formState;

  function onSubmit(values: MethodFormValues) {
    const data = {
      ...values,
      steps: values.steps.map((step) => ({
        title: step.title,
        detail: step.detail || undefined,
      })),
      examples: values.examples.length ? values.examples : undefined,
      lastReviewed: currentDay(),
    };
    if (method) {
      dataActions.update("methods", method.id, data);
      toast.success("Method updated");
      onSaved?.({ ...method, ...data });
    } else {
      const created = dataActions.create("methods", data);
      toast.success(`Method "${created.title}" created`);
      onSaved?.(created);
    }
    onDone();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{method ? "Edit method" : "New method"}</DialogTitle>
        <DialogDescription>
          A repeatable workflow: ordered steps, plus templates to copy.
        </DialogDescription>
      </DialogHeader>
      <form
        id="method-form"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField
          id="method-title"
          label="Title"
          required
          error={errors.title?.message}
        >
          <Input
            id="method-title"
            autoFocus
            aria-invalid={Boolean(errors.title)}
            {...form.register("title")}
          />
        </FormField>
        <FormField id="method-category" label="Category">
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as MethodCategory)
                }
              >
                <SelectTrigger id="method-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(methodCategoryMeta).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField
          id="method-summary"
          label="Summary"
          required
          error={errors.summary?.message}
          className="sm:col-span-2"
        >
          <Input
            id="method-summary"
            aria-invalid={Boolean(errors.summary)}
            {...form.register("summary")}
          />
        </FormField>
        <FormField id="method-tags" label="Tags" className="sm:col-span-2">
          <Controller
            control={form.control}
            name="tags"
            render={({ field }) => (
              <TagInput
                id="method-tags"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>

        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">
            Steps<span className="text-destructive">*</span>
          </legend>
          <ol className="flex flex-col gap-2">
            {steps.fields.map((field, index) => (
              <li key={field.id} className="flex gap-2 rounded-xl border p-2.5">
                <span className="mt-2 w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {index + 1}.
                </span>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Input
                    aria-label={`Step ${index + 1} title`}
                    placeholder="What to do"
                    aria-invalid={Boolean(errors.steps?.[index]?.title)}
                    {...form.register(`steps.${index}.title`)}
                  />
                  {errors.steps?.[index]?.title && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.steps[index].title.message}
                    </p>
                  )}
                  <Textarea
                    aria-label={`Step ${index + 1} detail`}
                    placeholder="How, or why it matters (optional)"
                    rows={1}
                    className="min-h-9"
                    {...form.register(`steps.${index}.detail`)}
                  />
                </div>
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move step up"
                    disabled={index === 0}
                    onClick={() => steps.move(index, index - 1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move step down"
                    disabled={index === steps.fields.length - 1}
                    onClick={() => steps.move(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove step"
                    disabled={steps.fields.length === 1}
                    onClick={() => steps.remove(index)}
                  >
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          {errors.steps?.root?.message && (
            <p role="alert" className="text-xs text-destructive">
              {errors.steps.root.message}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => steps.append({ title: "", detail: "" })}
          >
            <Plus /> Add step
          </Button>
        </fieldset>

        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">
            Examples and templates
          </legend>
          {examples.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 rounded-xl border p-2.5">
              <div className="flex flex-1 flex-col gap-1.5">
                <Input
                  aria-label={`Example ${index + 1} title`}
                  placeholder="e.g. Message template"
                  aria-invalid={Boolean(errors.examples?.[index]?.title)}
                  {...form.register(`examples.${index}.title`)}
                />
                <Textarea
                  aria-label={`Example ${index + 1} content`}
                  className="min-h-20 font-mono text-xs"
                  aria-invalid={Boolean(errors.examples?.[index]?.content)}
                  {...form.register(`examples.${index}.content`)}
                />
                {(errors.examples?.[index]?.title ||
                  errors.examples?.[index]?.content) && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.examples[index].title?.message ??
                      errors.examples[index].content?.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove example"
                onClick={() => examples.remove(index)}
              >
                <X />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => examples.append({ title: "", content: "" })}
          >
            <Plus /> Add example
          </Button>
        </fieldset>
      </form>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" form="method-form">
          {method ? "Save changes" : "Create method"}
        </Button>
      </DialogFooter>
    </>
  );
}
