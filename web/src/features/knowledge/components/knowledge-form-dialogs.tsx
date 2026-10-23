"use client";

import { toast } from "sonner";

import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import { linkOptions } from "@/features/knowledge/lib/link-options";
import {
  noteSchema,
  snippetSchema,
} from "@/features/knowledge/schemas/knowledge-schema";
import {
  snippetLanguages,
  type Note,
  type Snippet,
} from "@/features/knowledge/types/knowledge";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { SAMPLE_TODAY } from "@/lib/sample-data/work";

type DialogProps<T> = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Edit this item instead of creating a new one. */
  item?: T;
  defaultProjectId?: string;
  onSaved?: (item: T) => void;
};

export function NoteFormDialog({
  item,
  defaultProjectId,
  onSaved,
  ...dialog
}: DialogProps<Note>) {
  const data = useAppData();
  const options = linkOptions(data);

  return (
    <EntityFormDialog
      {...dialog}
      className="sm:max-w-2xl"
      title={item ? "Edit note" : "New note"}
      description="Markdown is supported: headings, lists, tables, code and checklists."
      schema={noteSchema}
      submitLabel={item ? "Save changes" : "Create note"}
      defaults={{
        title: item?.title ?? "",
        body: item?.body ?? "",
        tags: item?.tags ?? [],
        projectIds:
          item?.projectIds ?? (defaultProjectId ? [defaultProjectId] : []),
        taskIds: item?.taskIds ?? [],
      }}
      fields={[
        {
          name: "title",
          label: "Title",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "body",
          label: "Content",
          type: "code",
          rows: 10,
          placeholder: "## Context\n\nWrite in Markdown…",
        },
        { name: "tags", label: "Tags", type: "tags" },
        {
          name: "projectIds",
          label: "Linked projects",
          type: "multi",
          options: options.projects,
        },
        {
          name: "taskIds",
          label: "Linked tasks",
          type: "multi",
          options: options.tasks,
        },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("notes", item.id, {
            ...values,
            updatedAt: SAMPLE_TODAY,
          });
          toast.success("Note updated");
          onSaved?.({ ...item, ...values });
        } else {
          const created = dataActions.create("notes", {
            ...values,
            body: values.body ?? "",
            createdAt: SAMPLE_TODAY,
            updatedAt: SAMPLE_TODAY,
          });
          toast.success(`Note "${created.title}" created`);
          onSaved?.(created);
        }
      }}
    />
  );
}

export function SnippetFormDialog({
  item,
  defaultProjectId,
  onSaved,
  ...dialog
}: DialogProps<Snippet>) {
  const data = useAppData();
  const options = linkOptions(data);

  return (
    <EntityFormDialog
      {...dialog}
      className="sm:max-w-2xl"
      title={item ? "Edit snippet" : "New snippet"}
      description="Code is stored as text and only displayed, never executed."
      schema={snippetSchema}
      submitLabel={item ? "Save changes" : "Create snippet"}
      defaults={{
        title: item?.title ?? "",
        language:
          (item?.language as (typeof snippetLanguages)[number]) ?? "typescript",
        code: item?.code ?? "",
        explanation: item?.explanation ?? "",
        sourceUrl: item?.sourceUrl ?? "",
        tags: item?.tags ?? [],
        projectIds:
          item?.projectIds ?? (defaultProjectId ? [defaultProjectId] : []),
        taskIds: item?.taskIds ?? [],
      }}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        {
          name: "language",
          label: "Language",
          type: "select",
          options: snippetLanguages.map((value) => ({ value, label: value })),
        },
        { name: "code", label: "Code", type: "code", rows: 9, required: true },
        {
          name: "explanation",
          label: "Explanation",
          type: "textarea",
          rows: 2,
        },
        {
          name: "sourceUrl",
          label: "Source URL",
          type: "url",
          full: true,
          placeholder: "https://",
        },
        { name: "tags", label: "Tags", type: "tags" },
        {
          name: "projectIds",
          label: "Linked projects",
          type: "multi",
          options: options.projects,
        },
        {
          name: "taskIds",
          label: "Linked tasks",
          type: "multi",
          options: options.tasks,
        },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("snippets", item.id, {
            ...values,
            updatedAt: SAMPLE_TODAY,
          });
          toast.success("Snippet updated");
          onSaved?.({ ...item, ...values });
        } else {
          const created = dataActions.create("snippets", {
            ...values,
            createdAt: SAMPLE_TODAY,
            updatedAt: SAMPLE_TODAY,
          });
          toast.success(`Snippet "${created.title}" created`);
          onSaved?.(created);
        }
      }}
    />
  );
}
