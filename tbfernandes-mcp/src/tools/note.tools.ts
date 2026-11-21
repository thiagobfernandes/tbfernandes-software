import { z } from 'zod';

import { definedFields } from './defined-fields.ts';
import {
  defineTool,
  type ToolContext,
  type ToolRegistration,
} from './define-tool.ts';
import {
  appendToBody,
  mergeTags,
  toNoteSummary,
  withLink,
  type Note,
} from './note-view.ts';
import { uuid } from './schemas.ts';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const noteTitle = z.string().min(1).max(200);

export function noteTools(context: ToolContext): ToolRegistration[] {
  return [
    listNotes(context),
    getNote(context),
    createNote(context),
    updateNote(context),
    appendToNote(context),
    deleteNote(context),
  ];
}

function listNotes({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'list_notes',
    description:
      'Lista ou busca notas (Conhecimento). Retorna id, título, tags e um trecho do corpo.',
    input: {
      q: z.string().optional().describe('texto para buscar no título/corpo'),
      tag: z.string().optional().describe('filtra por uma tag exata'),
      page: z.number().int().min(0).optional(),
      size: z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
    },
    run: async ({ q, tag, page = 0, size = DEFAULT_PAGE_SIZE }) => {
      const { items, total } = await api.list<Note>('/notes', {
        q,
        tag,
        page,
        size,
      });
      return { total, notes: items.map(toNoteSummary) };
    },
  });
}

function getNote({ api, webUrl }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'get_note',
    description: 'Lê uma nota completa (corpo em Markdown) pelo id.',
    input: { id: uuid },
    run: async ({ id }) =>
      withLink(await api.get<Note>(`/notes/${id}`), webUrl),
  });
}

function createNote({ api, webUrl }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'create_note',
    description:
      'Cria uma nota em Markdown. Use tags para organizar (ex.: "filosofia", "diario-filosofico", "semana-1").',
    input: {
      title: noteTitle,
      body: z.string().optional().describe('conteúdo em Markdown'),
      tags: z.array(z.string()).optional(),
      projectIds: z.array(uuid).optional(),
      taskIds: z.array(uuid).optional(),
    },
    run: async (fields) =>
      withLink(await api.post<Note>('/notes', definedFields(fields)), webUrl),
  });
}

function updateNote({ api, webUrl }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'update_note',
    description:
      'Edita uma nota. Campos omitidos são mantidos. Para trocar o corpo inteiro envie body; para acrescentar, use append_to_note.',
    input: {
      id: uuid,
      title: noteTitle.optional(),
      body: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    run: async ({ id, ...changes }) => {
      const current = await api.get<Note>(`/notes/${id}`);
      const updated = await api.put<Note>(`/notes/${id}`, {
        ...current,
        ...definedFields(changes),
      });
      return withLink(updated, webUrl);
    },
  });
}

function appendToNote({ api, webUrl }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'append_to_note',
    description:
      'Acrescenta texto ao fim de uma nota (útil para diário). Opcionalmente adiciona um cabeçalho com a data de hoje.',
    input: {
      id: uuid,
      text: z.string().min(1),
      withDateHeading: z
        .boolean()
        .optional()
        .describe('prefixa "## AAAA-MM-DD"'),
      addTags: z.array(z.string()).optional(),
    },
    run: async ({ id, text, withDateHeading, addTags }) => {
      const current = await api.get<Note>(`/notes/${id}`);
      const body = appendToBody(current, text, withDateHeading);
      const tags = mergeTags(current, addTags);
      return withLink(
        await api.put<Note>(`/notes/${id}`, { ...current, body, tags }),
        webUrl,
      );
    },
  });
}

function deleteNote({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'delete_note',
    description:
      'Exclui uma nota definitivamente. Só use quando o usuário pedir.',
    input: { id: uuid },
    run: async ({ id }) => {
      await api.delete(`/notes/${id}`);
      return { deleted: id };
    },
  });
}
