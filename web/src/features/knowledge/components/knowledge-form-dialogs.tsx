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
import { currentDay } from "@/lib/today";

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
      title={item ? "Editar nota" : "Nova nota"}
      description="Aceita Markdown: títulos, listas, tabelas, código e checklists."
      schema={noteSchema}
      submitLabel={item ? "Salvar alterações" : "Criar nota"}
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
          label: "Título",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "body",
          label: "Conteúdo",
          type: "code",
          rows: 10,
          placeholder: "## Contexto\n\nEscreva em Markdown…",
        },
        { name: "tags", label: "Tags", type: "tags" },
        {
          name: "projectIds",
          label: "Projetos vinculados",
          type: "multi",
          options: options.projects,
        },
        {
          name: "taskIds",
          label: "Tarefas vinculadas",
          type: "multi",
          options: options.tasks,
        },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("notes", item.id, {
            ...values,
            updatedAt: currentDay(),
          });
          toast.success("Nota atualizada");
          onSaved?.({ ...item, ...values });
        } else {
          const created = dataActions.create("notes", {
            ...values,
            body: values.body ?? "",
            createdAt: currentDay(),
            updatedAt: currentDay(),
          });
          toast.success(`Nota "${created.title}" criada`);
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
      title={item ? "Editar snippet" : "Novo snippet"}
      description="O código é guardado como texto e só exibido, nunca executado."
      schema={snippetSchema}
      submitLabel={item ? "Salvar alterações" : "Criar snippet"}
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
        { name: "title", label: "Título", type: "text", required: true },
        {
          name: "language",
          label: "Linguagem",
          type: "select",
          options: snippetLanguages.map((value) => ({ value, label: value })),
        },
        {
          name: "code",
          label: "Código",
          type: "code",
          rows: 9,
          required: true,
        },
        {
          name: "explanation",
          label: "Explicação",
          type: "textarea",
          rows: 2,
        },
        {
          name: "sourceUrl",
          label: "URL de origem",
          type: "url",
          full: true,
          placeholder: "https://",
        },
        { name: "tags", label: "Tags", type: "tags" },
        {
          name: "projectIds",
          label: "Projetos vinculados",
          type: "multi",
          options: options.projects,
        },
        {
          name: "taskIds",
          label: "Tarefas vinculadas",
          type: "multi",
          options: options.tasks,
        },
      ]}
      onSubmit={(values) => {
        if (item) {
          dataActions.update("snippets", item.id, {
            ...values,
            updatedAt: currentDay(),
          });
          toast.success("Snippet atualizado");
          onSaved?.({ ...item, ...values });
        } else {
          const created = dataActions.create("snippets", {
            ...values,
            createdAt: currentDay(),
            updatedAt: currentDay(),
          });
          toast.success(`Snippet "${created.title}" criado`);
          onSaved?.(created);
        }
      }}
    />
  );
}
