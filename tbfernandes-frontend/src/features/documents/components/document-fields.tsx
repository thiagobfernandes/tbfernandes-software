"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  FieldConfig,
  FieldSection,
} from "@/features/documents/lib/templates";
import type { DocumentStep } from "@/features/documents/types";

type Values = Record<string, unknown>;

const toLines = (items: string[]) => items.join("\n");
const fromLines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const stepsToLines = (steps: DocumentStep[]) =>
  steps
    .map((s) => (s.description ? `${s.title}: ${s.description}` : s.title))
    .join("\n");
const stepsFromLines = (text: string): DocumentStep[] =>
  fromLines(text).map((line) => {
    const at = line.indexOf(":");
    return at < 0
      ? { title: line, description: "" }
      : {
          title: line.slice(0, at).trim(),
          description: line.slice(at + 1).trim(),
        };
  });

/**
 * Multi-line fields keep their own text so blank lines survive while typing;
 * the parsed value goes up on every change.
 */
function LinesField({
  id,
  field,
  initial,
  onChange,
}: {
  id: string;
  field: FieldConfig;
  initial: string;
  onChange: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <Textarea
      id={id}
      rows={field.rows ?? 4}
      value={text}
      placeholder={field.placeholder}
      onChange={(event) => {
        setText(event.target.value);
        onChange(event.target.value);
      }}
    />
  );
}

function Field({
  field,
  values,
  onChange,
}: {
  field: FieldConfig;
  values: Values;
  onChange: (key: string, value: unknown) => void;
}) {
  const id = `doc-field-${field.key}`;
  const value = values[field.key];

  if (field.kind === "toggle") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(field.key, checked === true)}
        />
        <Label htmlFor={id}>{field.label}</Label>
      </div>
    );
  }

  let control: React.ReactNode;
  switch (field.kind) {
    case "list":
      control = (
        <LinesField
          id={id}
          field={field}
          initial={toLines((value as string[]) ?? [])}
          onChange={(text) => onChange(field.key, fromLines(text))}
        />
      );
      break;
    case "steps":
      control = (
        <LinesField
          id={id}
          field={field}
          initial={stepsToLines((value as DocumentStep[]) ?? [])}
          onChange={(text) => onChange(field.key, stepsFromLines(text))}
        />
      );
      break;
    case "textarea":
      control = (
        <Textarea
          id={id}
          rows={field.rows ?? 3}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      );
      break;
    default:
      control = (
        <Input
          id={id}
          type={field.kind === "date" ? "date" : "text"}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{field.label}</Label>
      {control}
      {field.hint && (
        <p className="text-xs text-muted-foreground">{field.hint}</p>
      )}
    </div>
  );
}

export function DocumentFields({
  sections,
  values,
  onChange,
}: {
  sections: FieldSection[];
  values: Values;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <fieldset key={section.title} className="flex flex-col gap-4">
          <legend className="mb-3 text-xs font-semibold tracking-wider text-primary uppercase">
            {section.title}
          </legend>
          {section.fields.map((field) => (
            <Field
              key={field.key}
              field={field}
              values={values}
              onChange={onChange}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}
