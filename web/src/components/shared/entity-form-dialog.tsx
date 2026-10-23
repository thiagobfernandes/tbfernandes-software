"use client";

import { useState } from "react";
import {
  Controller,
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { emptyToUndefined, FormField } from "@/components/shared/form-field";
import {
  MultiSelectList,
  type MultiSelectOption,
} from "@/components/shared/multi-select-list";
import { TagInput } from "@/components/shared/tag-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";

/** Select value meaning "not set"; Radix Select does not allow "". */
const NONE = "__none";

export type EntityField<V> = {
  name: Extract<keyof V, string>;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** Spans both columns of the form grid. */
  full?: boolean;
} & (
  | { type: "text" | "url" | "date" }
  | { type: "number"; step?: number; min?: number }
  | { type: "textarea" | "code"; rows?: number }
  | {
      type: "select";
      options: { value: string; label: string }[];
      /** Adds a "None" option that clears the value. */
      optional?: boolean;
    }
  | { type: "tags" }
  | { type: "multi"; options: MultiSelectOption[]; emptyLabel?: string }
  | { type: "checkbox" }
);

type EntityFormDialogProps<S extends z.ZodType<FieldValues, FieldValues>> = {
  title: string;
  description?: string;
  schema: S;
  fields: EntityField<z.input<S>>[];
  /** Values the form starts from; refreshed each time the dialog opens. */
  defaults: z.input<S>;
  submitLabel: string;
  onSubmit: (values: z.output<S>) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/**
 * One dialog for every simple create/edit form: fields come from config and
 * validation from the zod schema, so modules only describe their data.
 */
export function EntityFormDialog<
  S extends z.ZodType<FieldValues, FieldValues>,
>({
  title,
  description,
  schema,
  fields,
  defaults,
  submitLabel,
  onSubmit,
  trigger,
  open: controlledOpen,
  onOpenChange,
  className,
}: EntityFormDialogProps<S>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const formId = `form-${title.toLowerCase().replace(/\W+/g, "-")}`;

  type In = z.input<S>;
  type Out = z.output<S>;
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(schema as never) as unknown as Resolver<
      In,
      unknown,
      Out
    >,
    values: open ? defaults : undefined,
    defaultValues: defaults as DefaultValues<In>,
    resetOptions: { keepDefaultValues: false },
  });
  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn("max-h-[90svh] overflow-y-auto sm:max-w-xl", className)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          id={formId}
          noValidate
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit((values) => {
            onSubmit(
              emptyToUndefined(values as Record<string, unknown>) as Out,
            );
            setOpen(false);
          })}
        >
          {fields.map((field, index) => {
            const id = `${formId}-${field.name}`;
            const name = field.name as unknown as Path<In>;
            const error = (errors as Record<string, { message?: string }>)[
              field.name
            ]?.message;
            const wide =
              field.full ||
              ["textarea", "code", "tags", "multi"].includes(field.type);
            return (
              <FormField
                key={field.name}
                id={id}
                label={field.label}
                required={field.required}
                hint={field.hint}
                error={error}
                className={cn(
                  wide && "sm:col-span-2",
                  field.type === "checkbox" && "justify-end",
                )}
              >
                <Controller
                  control={form.control}
                  name={name}
                  render={({ field: control }) => {
                    const common = {
                      id,
                      "aria-invalid": Boolean(error),
                      placeholder: field.placeholder,
                      autoFocus: index === 0,
                    };
                    switch (field.type) {
                      case "textarea":
                      case "code":
                        return (
                          <Textarea
                            {...common}
                            rows={field.rows ?? 4}
                            // The textarea grows with content; rows sets the floor.
                            style={{
                              minHeight: `${(field.rows ?? 4) * 1.25 + 1}rem`,
                            }}
                            spellCheck={field.type !== "code"}
                            className={cn(
                              field.type === "code" && "font-mono text-xs",
                            )}
                            value={control.value ?? ""}
                            onChange={control.onChange}
                            onBlur={control.onBlur}
                          />
                        );
                      case "number":
                        return (
                          <Input
                            {...common}
                            type="number"
                            inputMode="decimal"
                            step={field.step}
                            min={field.min}
                            value={control.value ?? ""}
                            onChange={(event) =>
                              control.onChange(
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                              )
                            }
                            onBlur={control.onBlur}
                          />
                        );
                      case "select":
                        return (
                          <Select
                            value={control.value || NONE}
                            onValueChange={(next) =>
                              control.onChange(next === NONE ? "" : next)
                            }
                          >
                            <SelectTrigger
                              id={id}
                              aria-invalid={Boolean(error)}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {field.optional && (
                                <SelectItem value={NONE}>None</SelectItem>
                              )}
                              {field.options.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      case "tags":
                        return (
                          <TagInput
                            id={id}
                            value={control.value ?? []}
                            onChange={control.onChange}
                          />
                        );
                      case "multi":
                        return (
                          <MultiSelectList
                            id={id}
                            options={field.options}
                            emptyLabel={field.emptyLabel}
                            value={control.value ?? []}
                            onChange={control.onChange}
                          />
                        );
                      case "checkbox":
                        return (
                          <label className="flex h-9 items-center gap-2 text-sm">
                            <Checkbox
                              id={id}
                              checked={Boolean(control.value)}
                              onCheckedChange={(next) =>
                                control.onChange(next === true)
                              }
                            />
                            {field.placeholder ?? "Yes"}
                          </label>
                        );
                      default:
                        return (
                          <Input
                            {...common}
                            type={field.type}
                            value={control.value ?? ""}
                            onChange={control.onChange}
                            onBlur={control.onBlur}
                          />
                        );
                    }
                  }}
                />
              </FormField>
            );
          })}
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form={formId}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
