import { z } from 'zod';

import { definedFields } from './defined-fields.ts';
import {
  defineTool,
  type ToolContext,
  type ToolRegistration,
} from './define-tool.ts';
import { uuid } from './schemas.ts';

const snippetTitle = z.string().min(1).max(200);
const snippetLanguage = z
  .string()
  .min(1)
  .max(30)
  .describe('linguagem do código, ex.: typescript, sql, bash');
const snippetCode = z
  .string()
  .min(1)
  .describe('o código, guardado exatamente como enviado (nunca executado)');
const snippetExplanation = z
  .string()
  .max(5000)
  .describe('explicação em Markdown: o conceito, quando usar, armadilhas');
const snippetSourceUrl = z.string().max(2000);
const snippetTags = z.array(z.string());

interface Snippet {
  id: string;
  title: string;
  language: string;
  tags: string[];
  explanation?: string | null;
}

export function snippetTools(context: ToolContext): ToolRegistration[] {
  return [
    listSnippets(context),
    getSnippet(context),
    createSnippet(context),
    updateSnippet(context),
  ];
}

function listSnippets({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'list_snippets',
    description:
      'Lista ou busca snippets de código (Conhecimento). Retorna id, título, linguagem e tags.',
    input: {
      q: z.string().optional().describe('texto para buscar'),
      language: z.string().optional(),
      tag: z.string().optional().describe('filtra por uma tag exata'),
    },
    run: async ({ q, language, tag }) =>
      (await api.list<Snippet>('/snippets', { q, language, tag })).items.map(
        ({ id, title, language: lang, tags }) => ({
          id,
          title,
          language: lang,
          tags,
        }),
      ),
  });
}

function getSnippet({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'get_snippet',
    description: 'Lê um snippet completo (código e explicação) pelo id.',
    input: { id: uuid },
    run: ({ id }) => api.get(`/snippets/${id}`),
  });
}

function createSnippet({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'create_snippet',
    description:
      'Cria um snippet de código com explicação em Markdown, tags e vínculo opcional a projetos e tarefas.',
    input: {
      title: snippetTitle,
      language: snippetLanguage,
      code: snippetCode,
      explanation: snippetExplanation.optional(),
      sourceUrl: snippetSourceUrl.optional(),
      tags: snippetTags.optional(),
      projectIds: z.array(uuid).optional(),
      taskIds: z.array(uuid).optional(),
    },
    run: (fields) => api.post('/snippets', definedFields(fields)),
  });
}

function updateSnippet({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'update_snippet',
    description:
      'Edita um snippet. Campos omitidos são mantidos (lê o registro e envia o PUT completo).',
    input: {
      id: uuid,
      title: snippetTitle.optional(),
      language: snippetLanguage.optional(),
      code: snippetCode.optional(),
      explanation: snippetExplanation.optional(),
      sourceUrl: snippetSourceUrl.optional(),
      tags: snippetTags.optional(),
      projectIds: z.array(uuid).optional(),
      taskIds: z.array(uuid).optional(),
    },
    run: async ({ id, ...changes }) => {
      const current = await api.get(`/snippets/${id}`);
      return api.put(`/snippets/${id}`, {
        ...current,
        ...definedFields(changes),
      });
    },
  });
}
